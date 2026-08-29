import pytest


def test_login_success(client):
    # Test logging in with seeded admin account
    response = client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "admin123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["username"] == "admin"
    assert data["user"]["role"] == "admin"


def test_login_invalid_credentials(client):
    response = client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "wrong_password_999"},
    )
    assert response.status_code == 401
    assert "Invalid username or password" in response.json()["detail"]


def test_oauth2_token_form(client):
    # Form data used by Swagger UI Authorize dialog
    response = client.post(
        "/api/auth/token",
        data={"username": "operator", "password": "operator123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_get_me_with_and_without_token(client):
    # 1. Without token -> 401
    res_no_token = client.get("/api/auth/me")
    assert res_no_token.status_code == 401

    # 2. With valid Bearer token
    login_res = client.post(
        "/api/auth/login",
        json={"username": "operator", "password": "operator123"},
    )
    token = login_res.json()["access_token"]

    res_with_token = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res_with_token.status_code == 200
    me_data = res_with_token.json()
    assert me_data["username"] == "operator"
    assert me_data["role"] == "operator"


def test_register_and_login_new_user(client):
    new_username = "test_field_engineer"
    # Register
    reg_res = client.post(
        "/api/auth/register",
        json={
            "username": new_username,
            "email": "field@landguard.ai",
            "password": "fieldpassword123",
            "role": "analyst",
            "full_name": "Field Test Engineer",
        },
    )
    assert reg_res.status_code == 201
    assert reg_res.json()["username"] == new_username
    assert reg_res.json()["role"] == "analyst"

    # Login with new account
    login_res = client.post(
        "/api/auth/login",
        json={"username": new_username, "password": "fieldpassword123"},
    )
    assert login_res.status_code == 200
    assert login_res.json()["user"]["role"] == "analyst"


def test_rbac_admin_vs_viewer(client):
    # 1. Login as viewer
    viewer_token = client.post(
        "/api/auth/login",
        json={"username": "viewer", "password": "viewer123"},
    ).json()["access_token"]

    # Viewer trying to access admin-only /api/auth/users -> 403 Forbidden
    res_forbidden = client.get(
        "/api/auth/users",
        headers={"Authorization": f"Bearer {viewer_token}"},
    )
    assert res_forbidden.status_code == 403

    # 2. Login as admin
    admin_token = client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "admin123"},
    ).json()["access_token"]

    # Admin accessing /api/auth/users -> 200 OK
    res_admin = client.get(
        "/api/auth/users",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_admin.status_code == 200
    users_list = res_admin.json()
    assert len(users_list) >= 4
    usernames = [u["username"] for u in users_list]
    assert "admin" in usernames
    assert "operator" in usernames
