import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models.node import Node
from datetime import datetime

# In-memory SQLite database for isolated test execution
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Creates a fresh database schema for each test."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    
    # Seed default node
    default_node = Node(
        node_id="LG-N01",
        name="Test Slope Monitor Alpha",
        latitude=31.1048,
        longitude=77.1734,
        altitude_m=2276.0,
        description="Sector 7 Test Station",
        status="online",
        firmware_version="v0.1.3-proto",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        last_seen=datetime.utcnow(),
    )
    session.add(default_node)
    session.commit()
    
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


from app.services.security_service import security_service

@pytest.fixture(scope="function")
def client(db_session):
    """Test client with overridden database dependency and clean security watermarks."""
    security_service.reset_watermarks()
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    security_service.reset_watermarks()
