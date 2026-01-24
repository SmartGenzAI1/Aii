"""
Production-Grade Database Module
Optimized database operations with connection pooling, caching, and monitoring.
"""

import asyncio
import time
import logging
from typing import Optional, List, Dict, Any, Type, Union
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import text, select, update, delete, func, Index, Table, Column, Integer, String, DateTime, Boolean, Text, Float
from sqlalchemy.pool import AsyncAdaptedQueuePool
from sqlalchemy.exc import SQLAlchemyError, OperationalError, IntegrityError
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
import json
from dataclasses import dataclass

from core.config import settings
from core.logging import setup_logging

logger = logging.getLogger(__name__)

# Database configuration
@dataclass
class DatabaseConfig:
    """Database configuration with optimized settings."""
    
    # Connection settings
    pool_size: int = 20
    max_overflow: int = 40
    pool_timeout: int = 30
    pool_recycle: int = 3600
    pool_pre_ping: bool = True
    pool_reset_on_return: str = 'commit'
    
    # Query settings
    statement_timeout: int = 30000  # 30 seconds
    lock_timeout: int = 10000       # 10 seconds
    idle_in_transaction_session_timeout: int = 600000  # 10 minutes
    
    # Performance settings
    enable_query_logging: bool = False
    slow_query_threshold: float = 1.0  # seconds
    
    # Monitoring settings
    enable_metrics: bool = True
    metrics_collection_interval: int = 60  # seconds


class DatabaseMetrics:
    """Database performance metrics collection."""
    
    def __init__(self):
        self.query_count = 0
        self.slow_query_count = 0
        self.error_count = 0
        self.total_query_time = 0.0
        self.connection_count = 0
        self.last_reset = datetime.utcnow()
    
    def record_query(self, duration: float, is_slow: bool = False):
        """Record query metrics."""
        self.query_count += 1
        self.total_query_time += duration
        if is_slow:
            self.slow_query_count += 1
    
    def record_error(self):
        """Record database error."""
        self.error_count += 1
    
    def get_stats(self) -> Dict[str, Any]:
        """Get current metrics."""
        uptime = (datetime.utcnow() - self.last_reset).total_seconds()
        avg_query_time = self.total_query_time / max(self.query_count, 1)
        
        return {
            "uptime_seconds": uptime,
            "total_queries": self.query_count,
            "slow_queries": self.slow_query_count,
            "error_count": self.error_count,
            "avg_query_time": round(avg_query_time, 4),
            "queries_per_second": round(self.query_count / max(uptime, 1), 2),
            "error_rate": round(self.error_count / max(self.query_count, 1), 4),
            "slow_query_rate": round(self.slow_query_count / max(self.query_count, 1), 4)
        }
    
    def reset(self):
        """Reset metrics."""
        self.query_count = 0
        self.slow_query_count = 0
        self.error_count = 0
        self.total_query_time = 0.0
        self.connection_count = 0
        self.last_reset = datetime.utcnow()


class OptimizedDatabase:
    """Production-grade database manager with advanced optimizations."""
    
    def __init__(self, config: Optional[DatabaseConfig] = None):
        self.config = config or DatabaseConfig()
        self.engine = None
        self.async_session_maker = None
        self.metrics = DatabaseMetrics()
        self._is_initialized = False
        self._connection_lock = asyncio.Lock()
        
        # Query cache for frequently accessed data
        self.query_cache = {}
        self.cache_ttl = 300  # 5 minutes
        
        # Prepared statements cache
        self.prepared_statements = {}
    
    async def initialize(self):
        """Initialize database connection with optimizations."""
        if self._is_initialized:
            return
        
        try:
            # Create optimized engine
            engine_kwargs = {
                "echo": self.config.enable_query_logging,
                "poolclass": AsyncAdaptedQueuePool,
                "pool_size": self.config.pool_size,
                "max_overflow": self.config.max_overflow,
                "pool_timeout": self.config.pool_timeout,
                "pool_recycle": self.config.pool_recycle,
                "pool_pre_ping": self.config.pool_pre_ping,
                "pool_reset_on_return": self.config.pool_reset_on_return,
                "future": True,
            }
            
            # PostgreSQL-specific optimizations
            if settings.effective_database_url.startswith('postgresql'):
                engine_kwargs.update({
                    "connect_args": {
                        "server_settings": {
                            "application_name": "genzai_backend",
                            "statement_timeout": str(self.config.statement_timeout),
                            "lock_timeout": str(self.config.lock_timeout),
                            "idle_in_transaction_session_timeout": str(self.config.idle_in_transaction_session_timeout),
                        },
                        "command_timeout": self.config.statement_timeout,
                    }
                })
            
            self.engine = create_async_engine(
                settings.effective_database_url,
                **engine_kwargs
            )
            
            # Create session factory
            self.async_session_maker = async_sessionmaker(
                self.engine,
                class_=AsyncSession,
                expire_on_commit=False,
                autoflush=False,
                autocommit=False
            )
            
            # Initialize metrics collection
            if self.config.enable_metrics:
                asyncio.create_task(self._collect_metrics())
            
            self._is_initialized = True
            logger.info("Database initialized with optimizations")
            
        except Exception as e:
            logger.error(f"Failed to initialize database: {e}")
            raise
    
    async def _collect_metrics(self):
        """Background task to collect database metrics."""
        while True:
            try:
                await asyncio.sleep(self.config.metrics_collection_interval)
                stats = self.metrics.get_stats()
                logger.info(f"Database metrics: {stats}")
            except Exception as e:
                logger.error(f"Error collecting database metrics: {e}")
    
    async def get_session(self, timeout: Optional[int] = None) -> AsyncSession:
        """Get database session with timeout and error handling."""
        if not self._is_initialized:
            await self.initialize()

        start_time = time.time()

        try:
            # Acquire connection with timeout
            if timeout:
                session = await asyncio.wait_for(
                    self.async_session_maker(),
                    timeout=timeout
                )
            else:
                session = self.async_session_maker()

            return session

        except asyncio.TimeoutError:
            logger.error(f"Database session timeout after {timeout} seconds")
            raise OperationalError("Session timeout", None, "Connection timeout")

        except Exception as e:
            self.metrics.record_error()
            logger.error(f"Database session error: {e}")
            raise

        finally:
            # Record metrics
            duration = time.time() - start_time
            is_slow = duration > self.config.slow_query_threshold
            self.metrics.record_query(duration, is_slow)
    
    async def execute_with_retry(self, operation, max_retries: int = 3, base_delay: float = 0.1):
        """Execute operation with exponential backoff retry."""
        last_exception = None
        
        for attempt in range(max_retries):
            try:
                return await operation()
            
            except (OperationalError, IntegrityError) as e:
                last_exception = e
                
                if attempt == max_retries - 1:
                    break
                
                # Exponential backoff
                delay = base_delay * (2 ** attempt)
                await asyncio.sleep(delay)
                continue
            
            except Exception as e:
                # Non-retryable error
                self.metrics.record_error()
                raise e
        
        # All retries failed
        self.metrics.record_error()
        raise last_exception
    
    async def execute_query(self, query, params: Optional[Dict] = None, timeout: Optional[int] = None):
        """Execute query with caching and monitoring."""
        query_str = str(query)
        cache_key = f"{query_str}:{json.dumps(params or {})}"
        
        # Check cache
        if cache_key in self.query_cache:
            cached_time, cached_result = self.query_cache[cache_key]
            if time.time() - cached_time < self.cache_ttl:
                return cached_result
        
        # Execute query
        async with self.get_session(timeout=timeout) as session:
            try:
                result = await session.execute(query, params or {})
                data = result.fetchall()
                
                # Cache result
                self.query_cache[cache_key] = (time.time(), data)
                
                return data
            
            except Exception as e:
                self.metrics.record_error()
                raise
    
    async def health_check(self) -> Dict[str, Any]:
        """Perform database health check."""
        try:
            async with self.get_session(timeout=5) as session:
                # Test basic connectivity
                await session.execute(text("SELECT 1"))
                
                # Get connection pool stats
                pool_stats = {
                    "pool_size": self.engine.pool.size(),
                    "checked_in": self.engine.pool.checkedin(),
                    "checked_out": self.engine.pool.checkedout(),
                    "overflow": self.engine.pool.overflow(),
                    "invalid": self.engine.pool.invalid(),
                }
                
                # Get metrics
                metrics = self.metrics.get_stats()
                
                return {
                    "status": "healthy",
                    "pool_stats": pool_stats,
                    "metrics": metrics,
                    "timestamp": datetime.utcnow().isoformat()
                }
        
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def optimize_tables(self):
        """Optimize database tables for performance."""
        try:
            async with self.get_session() as session:
                # Analyze tables
                await session.execute(text("ANALYZE"))
                
                # Vacuum analyze for PostgreSQL
                if settings.effective_database_url.startswith('postgresql'):
                    await session.execute(text("VACUUM ANALYZE"))
                
                logger.info("Database optimization completed")
        
        except Exception as e:
            logger.error(f"Database optimization failed: {e}")
    
    async def create_indexes(self):
        """Create performance indexes."""
        try:
            async with self.get_session() as session:
                # User table indexes
                await session.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
                    CREATE INDEX IF NOT EXISTS idx_users_daily_quota ON users(daily_quota);
                    CREATE INDEX IF NOT EXISTS idx_users_last_reset ON users(last_reset);
                """))
                
                # Chat table indexes
                await session.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);
                    CREATE INDEX IF NOT EXISTS idx_chats_workspace_id ON chats(workspace_id);
                    CREATE INDEX IF NOT EXISTS idx_chats_created_at ON chats(created_at);
                """))
                
                # Message table indexes
                await session.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
                    CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
                    CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
                    CREATE INDEX IF NOT EXISTS idx_messages_sequence_number ON messages(sequence_number);
                """))
                
                # File table indexes
                await session.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
                    CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at);
                    CREATE INDEX IF NOT EXISTS idx_files_size ON files(size);
                """))
                
                logger.info("Database indexes created")
        
        except Exception as e:
            logger.error(f"Index creation failed: {e}")
    
    async def cleanup_old_data(self, retention_days: int = 90):
        """Clean up old data based on retention policy."""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=retention_days)
            
            async with self.get_session() as session:
                # Clean up old messages (keep last 50 per chat)
                await session.execute(text("""
                    DELETE FROM messages 
                    WHERE id NOT IN (
                        SELECT id FROM (
                            SELECT id, ROW_NUMBER() OVER (PARTITION BY chat_id ORDER BY created_at DESC) as rn
                            FROM messages
                        ) ranked 
                        WHERE rn <= 50
                    )
                    AND created_at < :cutoff
                """), {"cutoff": cutoff_date})
                
                # Clean up old chats
                await session.execute(text("""
                    DELETE FROM chats 
                    WHERE created_at < :cutoff
                    AND id NOT IN (
                        SELECT DISTINCT chat_id FROM messages WHERE created_at >= :cutoff
                    )
                """), {"cutoff": cutoff_date})
                
                await session.commit()
                logger.info(f"Data cleanup completed for records older than {retention_days} days")
        
        except Exception as e:
            logger.error(f"Data cleanup failed: {e}")
            await session.rollback()
    
    async def get_slow_queries(self, limit: int = 10):
        """Get slow query statistics."""
        try:
            if settings.effective_database_url.startswith('postgresql'):
                async with self.get_session() as session:
                    result = await session.execute(text("""
                        SELECT 
                            query,
                            calls,
                            total_time,
                            mean_time,
                            max_time,
                            rows
                        FROM pg_stat_statements 
                        ORDER BY mean_time DESC 
                        LIMIT :limit
                    """), {"limit": limit})
                    
                    return result.fetchall()
            else:
                return []
        
        except Exception as e:
            logger.error(f"Failed to get slow queries: {e}")
            return []
    
    async def close(self):
        """Close database connections."""
        if self.engine:
            await self.engine.dispose()
            logger.info("Database connections closed")


# Global database instance
db = OptimizedDatabase()


# Database models with optimizations
Base = declarative_base()


class User(Base):
    """Optimized User model."""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    daily_quota = Column(Integer, default=50, nullable=False)
    daily_used = Column(Integer, default=0, nullable=False)
    last_reset = Column(DateTime, default=datetime.utcnow, nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_users_email_quota', 'email', 'daily_quota'),
        Index('idx_users_quota_reset', 'daily_quota', 'last_reset'),
    )


class Chat(Base):
    """Optimized Chat model."""
    __tablename__ = "chats"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, index=True, nullable=False)
    workspace_id = Column(Integer, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    model = Column(String(100), nullable=False)
    prompt = Column(Text, nullable=True)
    temperature = Column(Float, default=0.5, nullable=False)
    context_length = Column(Integer, default=4000, nullable=False)
    include_profile_context = Column(Boolean, default=True, nullable=False)
    include_workspace_instructions = Column(Boolean, default=True, nullable=False)
    embeddings_provider = Column(String(50), default='openai', nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_chats_user_workspace', 'user_id', 'workspace_id'),
        Index('idx_chats_created_model', 'created_at', 'model'),
    )


class Message(Base):
    """Optimized Message model."""
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, index=True, nullable=False)
    chat_id = Column(Integer, index=True, nullable=False)
    content = Column(Text, nullable=False)
    role = Column(String(20), nullable=False)  # user, assistant, system
    model = Column(String(100), nullable=False)
    sequence_number = Column(Integer, nullable=False)
    image_paths = Column(JSONB, default=list, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_messages_chat_sequence', 'chat_id', 'sequence_number'),
        Index('idx_messages_user_created', 'user_id', 'created_at'),
        Index('idx_messages_role_model', 'role', 'model'),
    )


class File(Base):
    """Optimized File model."""
    __tablename__ = "files"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    file_path = Column(String(500), nullable=False)
    size = Column(Integer, nullable=False)  # in bytes
    tokens = Column(Integer, nullable=True)
    type = Column(String(50), nullable=False)  # pdf, docx, txt, etc.
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_files_user_size', 'user_id', 'size'),
        Index('idx_files_type_created', 'type', 'created_at'),
    )


# Database initialization function
async def initialize_database():
    """Initialize database with optimizations."""
    try:
        await db.initialize()
        await db.create_indexes()
        logger.info("Database initialization completed")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise


# Database cleanup function
async def cleanup_database():
    """Cleanup database connections."""
    try:
        await db.close()
        logger.info("Database cleanup completed")
    except Exception as e:
        logger.error(f"Database cleanup failed: {e}")
