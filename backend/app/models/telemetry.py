from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Telemetry(Base):
    __tablename__ = "telemetry_readings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    node_id = Column(String(32), ForeignKey("nodes.node_id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Core Sensor Measurements
    soil_moisture = Column(Float, nullable=False)  # Calibrated Volumetric Water Content % (0-100)
    soil_moisture_raw = Column(Integer, nullable=True)  # Raw 12-bit ADC value (0-4095)
    rainfall = Column(Float, nullable=False, default=0.0)  # Current rain intensity %
    rainfall_24h = Column(Float, nullable=False, default=0.0)  # Cumulative precipitation in mm
    rain_detected = Column(Boolean, nullable=True, default=False)  # Digital rain detection flag
    
    # Kinematic & Displacement Measurements
    tilt_angle = Column(Float, nullable=False)  # Inclination angle in degrees (0-90)
    tilt_rate = Column(Float, nullable=False, default=0.0)  # Velocity in °/min
    accel_x = Column(Float, nullable=True, default=0.0)  # In g-force
    accel_y = Column(Float, nullable=True, default=0.0)
    accel_z = Column(Float, nullable=True, default=1.0)
    gyro_x = Column(Float, nullable=True, default=0.0)  # In °/s
    gyro_y = Column(Float, nullable=True, default=0.0)
    gyro_z = Column(Float, nullable=True, default=0.0)
    
    # Link & Hardware Diagnostics
    battery = Column(Float, nullable=False, default=100.0)  # Battery level %
    battery_mv = Column(Integer, nullable=True, default=3800)  # Voltage in mV
    rssi = Column(Integer, nullable=False, default=-70)  # LoRa RSSI in dBm
    snr = Column(Float, nullable=False, default=9.0)  # LoRa SNR in dB
    seq_num = Column(Integer, nullable=True)  # Packet sequence number

    # Relationships
    node = relationship("Node", back_populates="telemetries")
    risk_result = relationship("RiskResult", back_populates="telemetry", uselist=False, cascade="all, delete-orphan")
