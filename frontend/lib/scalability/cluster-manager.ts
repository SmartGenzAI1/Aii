import { performanceMonitor } from '../monitoring/logger'

interface ClusterNode {
  id: string
  url: string
  health: 'healthy' | 'degraded' | 'unhealthy'
  load: number // 0-100
  region: string
  lastHealthCheck: number
  capacity: {
    maxConcurrentUsers: number
    currentUsers: number
    memoryUsage: number
    cpuUsage: number
  }
}

interface ScalingConfig {
  minInstances: number
  maxInstances: number
  targetLoad: number // 0-100
  scaleUpThreshold: number
  scaleDownThreshold: number
  coolDownPeriod: number // ms
}

class ClusterManager {
  private static instance: ClusterManager
  private nodes: Map<string, ClusterNode> = new Map()
  private config: ScalingConfig
  private lastScaleAction = 0
  private healthCheckInterval: NodeJS.Timeout | null = null

  constructor() {
    this.config = {
      minInstances: 3,
      maxInstances: 50,
      targetLoad: 70,
      scaleUpThreshold: 85,
      scaleDownThreshold: 30,
      coolDownPeriod: 300000 // 5 minutes
    }

    // Start health checking
    this.startHealthChecks()

    // Auto-scaling monitor
    setInterval(() => this.checkScaling(), 30000) // Check every 30 seconds
  }

  static getInstance(): ClusterManager {
    if (!ClusterManager.instance) {
      ClusterManager.instance = new ClusterManager()
    }
    return ClusterManager.instance
  }

  registerNode(node: Omit<ClusterNode, 'lastHealthCheck'>): void {
    this.nodes.set(node.id, {
      ...node,
      lastHealthCheck: Date.now()
    })
  }

  unregisterNode(nodeId: string): void {
    this.nodes.delete(nodeId)
  }

  getHealthyNodes(): ClusterNode[] {
    return Array.from(this.nodes.values()).filter(
      node => node.health === 'healthy' && node.load < this.config.scaleUpThreshold
    )
  }

  getOptimalNode(userId?: string): ClusterNode | null {
    const healthyNodes = this.getHealthyNodes()

    if (healthyNodes.length === 0) return null

    // If userId provided, try to route to same node for session affinity
    if (userId) {
      const userHash = this.hashString(userId)
      const preferredNode = healthyNodes[userHash % healthyNodes.length]
      if (preferredNode.load < 90) { // Allow higher load for sticky sessions
        return preferredNode
      }
    }

    // Find least loaded healthy node
    return healthyNodes.reduce((min, node) =>
      node.load < min.load ? node : min
    )
  }

  private async checkHealth(node: ClusterNode): Promise<void> {
    const startTime = performance.now()

    try {
      const response = await fetch(`${node.url}/health`, {
        timeout: 5000,
        headers: { 'User-Agent': 'ClusterManager' }
      })

      const responseTime = performance.now() - startTime

      if (response.ok) {
        const healthData = await response.json()

        // Update node health
        const updatedNode = {
          ...node,
          health: responseTime < 1000 ? 'healthy' : 'degraded' as const,
          load: healthData.load || 50,
          capacity: healthData.capacity || node.capacity,
          lastHealthCheck: Date.now()
        }

        this.nodes.set(node.id, updatedNode)

        // Log performance metrics
        performanceMonitor.recordMetric(`node.${node.id}.responseTime`, responseTime)
        performanceMonitor.recordMetric(`node.${node.id}.load`, updatedNode.load)
      } else {
        this.markNodeUnhealthy(node.id)
      }
    } catch (error) {
      this.markNodeUnhealthy(node.id)
    }
  }

  private markNodeUnhealthy(nodeId: string): void {
    const node = this.nodes.get(nodeId)
    if (node) {
      this.nodes.set(nodeId, {
        ...node,
        health: 'unhealthy',
        lastHealthCheck: Date.now()
      })
    }
  }

  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      const promises = Array.from(this.nodes.values()).map(node =>
        this.checkHealth(node)
      )

      await Promise.allSettled(promises)
    }, 10000) // Health check every 10 seconds
  }

  private async checkScaling(): Promise<void> {
    const now = Date.now()
    if (now - this.lastScaleAction < this.config.coolDownPeriod) {
      return // Still in cooldown
    }

    const healthyNodes = Array.from(this.nodes.values()).filter(
      node => node.health === 'healthy'
    )

    if (healthyNodes.length === 0) return

    const avgLoad = healthyNodes.reduce((sum, node) => sum + node.load, 0) / healthyNodes.length
    const totalCapacity = healthyNodes.reduce((sum, node) => sum + node.capacity.maxConcurrentUsers, 0)
    const totalUsers = healthyNodes.reduce((sum, node) => sum + node.capacity.currentUsers, 0)

    // Scale up logic
    if (avgLoad > this.config.scaleUpThreshold && healthyNodes.length < this.config.maxInstances) {
      await this.scaleUp(avgLoad, totalUsers, totalCapacity)
      this.lastScaleAction = now
    }
    // Scale down logic
    else if (avgLoad < this.config.scaleDownThreshold && healthyNodes.length > this.config.minInstances) {
      await this.scaleDown(avgLoad, totalUsers)
      this.lastScaleAction = now
    }
  }

  private async scaleUp(avgLoad: number, totalUsers: number, totalCapacity: number): Promise<void> {
    const newInstances = Math.min(
      Math.ceil((totalUsers / totalCapacity) * 1.5), // Scale based on capacity needs
      this.config.maxInstances - this.nodes.size
    )

    if (newInstances <= 0) return

    console.log(`Scaling up: Adding ${newInstances} instances (avg load: ${avgLoad}%)`)

    // In a real implementation, this would trigger cloud auto-scaling
    // For now, we'll simulate by notifying monitoring systems
    performanceMonitor.recordMetric('cluster.scaleUp', newInstances)
  }

  private async scaleDown(avgLoad: number, totalUsers: number): Promise<void> {
    const instancesToRemove = Math.max(
      1,
      Math.floor((this.config.targetLoad - avgLoad) / 20) // Remove based on load reduction
    )

    const newInstanceCount = Math.max(
      this.config.minInstances,
      this.nodes.size - instancesToRemove
    )

    if (newInstanceCount >= this.nodes.size) return

    console.log(`Scaling down: Reducing to ${newInstanceCount} instances (avg load: ${avgLoad}%)`)

    // In a real implementation, this would trigger cloud scale-down
    performanceMonitor.recordMetric('cluster.scaleDown', this.nodes.size - newInstanceCount)
  }

  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  getStats(): {
    totalNodes: number
    healthyNodes: number
    avgLoad: number
    totalCapacity: number
    totalUsers: number
  } {
    const allNodes = Array.from(this.nodes.values())
    const healthyNodes = allNodes.filter(node => node.health === 'healthy')

    return {
      totalNodes: allNodes.length,
      healthyNodes: healthyNodes.length,
      avgLoad: healthyNodes.length > 0
        ? healthyNodes.reduce((sum, node) => sum + node.load, 0) / healthyNodes.length
        : 0,
      totalCapacity: allNodes.reduce((sum, node) => sum + node.capacity.maxConcurrentUsers, 0),
      totalUsers: allNodes.reduce((sum, node) => sum + node.capacity.currentUsers, 0)
    }
  }

  shutdown(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }
  }
}

export const clusterManager = ClusterManager.getInstance()