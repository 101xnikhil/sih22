def test_list_nodes(client):
    response = client.get("/api/nodes")
    assert response.status_code == 200
    nodes = response.json()
    assert len(nodes) >= 1
    assert nodes[0]["node_id"] == "LG-N01"


def test_get_node_by_id(client):
    response = client.get("/api/nodes/LG-N01")
    assert response.status_code == 200
    node = response.json()
    assert node["node_id"] == "LG-N01"
    assert node["latitude"] == 31.1048
    assert node["longitude"] == 77.1734


def test_get_nonexistent_node(client):
    response = client.get("/api/nodes/NON_EXISTENT_99")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_create_node(client):
    payload = {
        "node_id": "LG-N02",
        "name": "Slope Monitor Beta",
        "latitude": 31.1090,
        "longitude": 77.1780,
        "altitude_m": 2310.0,
        "description": "Sector 8 — Eastern Flank",
        "status": "online",
        "firmware_version": "v0.1.3-proto",
    }
    response = client.post("/api/nodes", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["node_id"] == "LG-N02"
    assert data["name"] == "Slope Monitor Beta"


def test_create_duplicate_node(client):
    payload = {
        "node_id": "LG-N01",
        "name": "Duplicate Alpha",
        "latitude": 31.1048,
        "longitude": 77.1734,
    }
    response = client.post("/api/nodes", json=payload)
    assert response.status_code == 409
