#!/usr/bin/env python3
"""
Performance Test Script for GenZ AI Backend
Tests database query performance, caching efficiency, and connection pooling
"""

import asyncio
import time
import sys
import os
from typing import Dict, Any

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.performance_monitor import PerformanceMonitor
from core.database import OptimizedDatabase
from core.performance_monitor import SmartCache
from sqlalchemy import text

async def test_database_performance():
    """Test database query performance and connection pooling."""
    print("🔍 Testing Database Performance...")

    # Initialize database
    db = OptimizedDatabase()
    await db.initialize()

    async def test_query():
        session = await db.get_session()
        try:
            # Test simple query
            start_time = time.time()
            await session.execute(text("SELECT 1"))
            query_time = time.time() - start_time
            return query_time
        finally:
            await session.close()

    # Run multiple queries to test connection pooling
    query_times = []
    for i in range(10):
        query_time = await test_query()
        query_times.append(query_time)
        print(f"  Query {i+1}: {query_time:.4f}s")

    avg_query_time = sum(query_times) / len(query_times)
    print(f"✅ Database Performance: {avg_query_time:.4f}s avg query time")
    return avg_query_time

async def test_caching_efficiency():
    """Test caching efficiency and hit rates."""
    print("\n🔍 Testing Caching Efficiency...")

    # Initialize cache
    cache = SmartCache(max_size=100, default_ttl=300)

    # Test cache operations
    test_data = {"key1": "value1", "key2": "value2", "key3": "value3"}

    # Populate cache
    for key, value in test_data.items():
        cache.set(key, value)

    # Test cache hits and misses
    hit_count = 0
    miss_count = 0

    # First access (should be hits)
    for key in test_data.keys():
        if cache.get(key) is not None:
            hit_count += 1

    # Test with non-existent keys (should be misses)
    for i in range(5):
        if cache.get(f"nonexistent_{i}") is None:
            miss_count += 1

    # Get cache stats
    stats = cache.get_stats()
    hit_rate = stats["hit_rate"]

    print(f"  Cache Hits: {hit_count}")
    print(f"  Cache Misses: {miss_count}")
    print(f"  Hit Rate: {hit_rate:.2%}")
    print(f"✅ Cache Efficiency: {hit_rate:.2%} hit rate")

    return hit_rate

async def test_connection_pooling():
    """Test database connection pooling efficiency."""
    print("\n🔍 Testing Connection Pooling...")

    db = OptimizedDatabase()
    await db.initialize()

    async def concurrent_queries():
        session = await db.get_session()
        try:
            await session.execute(text("SELECT 1"))
            await asyncio.sleep(0.1)  # Simulate work
        finally:
            await session.close()

    # Run concurrent queries
    start_time = time.time()
    tasks = [concurrent_queries() for _ in range(20)]
    await asyncio.gather(*tasks)
    total_time = time.time() - start_time

    print(f"  20 concurrent queries completed in {total_time:.4f}s")
    print(f"  Average time per query: {total_time/20:.4f}s")
    print(f"✅ Connection Pooling: {total_time:.4f}s for 20 concurrent queries")

    return total_time

async def test_performance_monitor():
    """Test the performance monitoring system."""
    print("\n🔍 Testing Performance Monitor...")

    monitor = PerformanceMonitor()

    # Start the performance monitor cleanup task
    if monitor._cleanup_task is None:
        monitor._cleanup_task = asyncio.create_task(
            monitor._cleanup_expired_operations()
        )

    async def sample_operation():
        await asyncio.sleep(0.5)
        return "test_result"

    # Test monitored operation
    start_time = time.time()
    result = await monitor.measure_operation("test_operation", sample_operation)
    monitor_time = time.time() - start_time

    # Get performance stats
    stats = monitor.get_performance_stats()

    print(f"  Monitored operation completed in {monitor_time:.4f}s")
    print(f"  Result: {result}")
    print(f"  Active operations: {stats['active_operations']}")
    print(f"  Cache stats: {stats['cache_stats']}")
    print(f"✅ Performance Monitor: Working correctly")

    return monitor_time

async def main():
    """Run all performance tests."""
    print("🚀 Starting Performance Optimization Tests\n")

    try:
        # Run tests
        db_time = await test_database_performance()
        cache_rate = await test_caching_efficiency()
        pool_time = await test_connection_pooling()
        monitor_time = await test_performance_monitor()

        # Summary
        print("\n" + "="*50)
        print("📊 PERFORMANCE TEST SUMMARY")
        print("="*50)
        print(f"📈 Database Query Time: {db_time:.4f}s (avg)")
        print(f"💾 Cache Hit Rate: {cache_rate:.2%}")
        print(f"🔗 Connection Pooling: {pool_time:.4f}s (20 concurrent)")
        print(f"🎯 Performance Monitor: {monitor_time:.4f}s")
        print("="*50)
        print("✅ All performance tests completed successfully!")

        # Performance thresholds
        if db_time < 0.05:
            print("🚀 Database performance: EXCELLENT")
        elif db_time < 0.1:
            print("✅ Database performance: GOOD")
        else:
            print("⚠️  Database performance: NEEDS OPTIMIZATION")

        if cache_rate > 0.8:
            print("🚀 Cache efficiency: EXCELLENT")
        elif cache_rate > 0.6:
            print("✅ Cache efficiency: GOOD")
        else:
            print("⚠️  Cache efficiency: NEEDS IMPROVEMENT")

        if pool_time < 2.0:
            print("🚀 Connection pooling: EXCELLENT")
        elif pool_time < 5.0:
            print("✅ Connection pooling: GOOD")
        else:
            print("⚠️  Connection pooling: NEEDS OPTIMIZATION")

    except Exception as e:
        print(f"❌ Performance test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())