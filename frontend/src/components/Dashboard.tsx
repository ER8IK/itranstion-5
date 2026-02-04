import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Table, Button, Form, Alert, Navbar, Nav, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { userAPI } from '../services/api';
import { User } from '../types';
import 'bootstrap-icons/font/bootstrap-icons.css';

/**
 * IMPORTANT: Main Dashboard component
 * Implements all requirements:
 * - Table with checkboxes (FOURTH REQUIREMENT)
 * - Toolbar with actions (SECOND REQUIREMENT)
 * - Sorted by last login (THIRD REQUIREMENT)
 * - Professional business look (no animations, wallpapers, or browser alerts)
 */
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  /**
   * NOTA BENE: Load current user from localStorage
   */
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
  }, []);

  /**
   * IMPORTANT: Fetch users on component mount
   */
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userAPI.getAll();
      setUsers(data);
      setMessage(null);
    } catch (error: any) {
      showMessage('danger', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  /**
   * NOTA BENE: Handle select all checkbox
   */
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)));
    }
    setSelectAll(!selectAll);
  };

  /**
   * Handle individual checkbox selection
   */
  const handleSelectUser = (userId: number) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
    setSelectAll(newSelected.size === users.length && users.length > 0);
  };

  /**
   * IMPORTANT: Show status messages (not browser alerts!)
   */
  const showMessage = (type: 'success' | 'danger', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  /**
   * Toolbar actions
   */
  const handleBlock = async () => {
    if (selectedUsers.size === 0) {
      showMessage('danger', 'Please select at least one user');
      return;
    }

    try {
      const response = await userAPI.block(Array.from(selectedUsers));
      showMessage('success', response.message);
      setSelectedUsers(new Set());
      setSelectAll(false);
      await loadUsers();
    } catch (error) {
      showMessage('danger', 'Failed to block users');
    }
  };

  const handleUnblock = async () => {
    if (selectedUsers.size === 0) {
      showMessage('danger', 'Please select at least one user');
      return;
    }

    try {
      const response = await userAPI.unblock(Array.from(selectedUsers));
      showMessage('success', response.message);
      setSelectedUsers(new Set());
      setSelectAll(false);
      await loadUsers();
    } catch (error) {
      showMessage('danger', 'Failed to unblock users');
    }
  };

  const handleDelete = async () => {
    if (selectedUsers.size === 0) {
      showMessage('danger', 'Please select at least one user');
      return;
    }

    try {
      const response = await userAPI.delete(Array.from(selectedUsers));
      showMessage('success', response.message);
      setSelectedUsers(new Set());
      setSelectAll(false);
      await loadUsers();
      
      /**
       * NOTA BENE: If current user deleted themselves, logout
       */
      if (currentUser && selectedUsers.has(currentUser.id)) {
        handleLogout();
      }
    } catch (error) {
      showMessage('danger', 'Failed to delete users');
    }
  };

  const handleDeleteUnverified = async () => {
    try {
      const response = await userAPI.deleteUnverified();
      showMessage('success', response.message);
      setSelectedUsers(new Set());
      setSelectAll(false);
      await loadUsers();
    } catch (error) {
      showMessage('danger', 'Failed to delete unverified users');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  /**
   * Format date for display
   */
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString();
  };

  /**
   * Get status badge variant
   */
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'blocked': return 'danger';
      case 'unverified': return 'warning';
      default: return 'secondary';
    }
  };

  return (
    <>
      {/* Navigation header */}
      <Navbar bg="dark" variant="dark" className="mb-4">
        <Container fluid>
          <Navbar.Brand>User Management System</Navbar.Brand>
          <Nav className="ms-auto">
            <Navbar.Text className="me-3">
              {currentUser?.email}
            </Navbar.Text>
            <Button variant="outline-light" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </Nav>
        </Container>
      </Navbar>

      <Container fluid>
        {/* Status messages */}
        {message && (
          <Alert variant={message.type} dismissible onClose={() => setMessage(null)}>
            {message.text}
          </Alert>
        )}

        {/* IMPORTANT: Toolbar - SECOND REQUIREMENT */}
        <div className="mb-3 p-3 bg-light border rounded">
          <div className="d-flex gap-2 align-items-center">
            <Button 
              variant="warning" 
              onClick={handleBlock}
              disabled={selectedUsers.size === 0}
            >
              Block
            </Button>

            <OverlayTrigger
              placement="top"
              overlay={<Tooltip>Unblock selected users</Tooltip>}
            >
              <Button 
                variant="success" 
                onClick={handleUnblock}
                disabled={selectedUsers.size === 0}
              >
                <i className="bi bi-unlock-fill"></i>
              </Button>
            </OverlayTrigger>

            <OverlayTrigger
              placement="top"
              overlay={<Tooltip>Delete selected users</Tooltip>}
            >
              <Button 
                variant="danger" 
                onClick={handleDelete}
                disabled={selectedUsers.size === 0}
              >
                <i className="bi bi-trash-fill"></i>
              </Button>
            </OverlayTrigger>

            <OverlayTrigger
              placement="top"
              overlay={<Tooltip>Delete all unverified users</Tooltip>}
            >
              <Button 
                variant="outline-danger" 
                onClick={handleDeleteUnverified}
              >
                <i className="bi bi-person-x-fill"></i>
              </Button>
            </OverlayTrigger>

            <span className="ms-3 text-muted">
              {selectedUsers.size > 0 && `${selectedUsers.size} user(s) selected`}
            </span>
          </div>
        </div>

        {/* IMPORTANT: User table - implements all table requirements */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                {/* FOURTH REQUIREMENT: Select all checkbox without label */}
                <th style={{ width: '50px', textAlign: 'center' }}>
                  <Form.Check
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    aria-label="Select all users"
                  />
                </th>
                <th>Name</th>
                <th>Email</th>
                <th>Last Login</th>
                <th>Registration Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    {/* FOURTH REQUIREMENT: Individual checkbox without label */}
                    <td style={{ textAlign: 'center' }}>
                      <Form.Check
                        type="checkbox"
                        checked={selectedUsers.has(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                        aria-label={`Select ${user.name}`}
                      />
                    </td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{formatDate(user.last_login)}</td>
                    <td>{formatDate(user.created_at)}</td>
                    <td>
                      <span className={`badge bg-${getStatusVariant(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        )}
      </Container>
    </>
  );
};

export default Dashboard;
