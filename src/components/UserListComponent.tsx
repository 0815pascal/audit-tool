import React, { useState } from 'react';
import { useUsers } from '../hooks/useUsers';
import { UserRole } from '../types/types';
import { UserId } from '../types/brandedTypes';
import { USER_ROLE_ENUM, STATUS_DISPLAY_ENUM, INPUT_TYPE_ENUM, Department } from '../enums';
import './UserListComponent.css';

const UserListComponent: React.FC = () => {
  const { 
    allUsers, 
    selectedUser,
    setSelectedUser,
    createUser,
    removeUser,
    toggleUserActive,
    changeUserRole
  } = useUsers();
  
  const [newUserName, setNewUserName] = useState('');
  const [newUserDepartment, setNewUserDepartment] = useState<Department>(Department.Claims);
  const [newUserRole, setNewUserRole] = useState<UserRole>(USER_ROLE_ENUM.STAFF);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  
  // Handle success/error messages for operations
  const handleAddUser = async () => {
    if (!newUserName.trim()) return;
    
    const newUser = {
      displayName: newUserName,
      department: newUserDepartment,
      authorities: newUserRole,
      enabled: true,
      initials: newUserName.split(' ').map(part => part[0]).join('')
    };
    
    try {
      await createUser(newUser);
      setStatusMessage('User created successfully');
      
      // Reset form
      setNewUserName('');
      setNewUserDepartment(Department.Claims);
      setNewUserRole(USER_ROLE_ENUM.STAFF);
      
      // Clear status message after 3 seconds
      setTimeout(() => setStatusMessage(null), 3000);
    } catch {
      setStatusMessage('Failed to create user');
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };
  
  const handleRemoveUser = async (userId: UserId) => {
    try {
      await removeUser(userId);
      setStatusMessage('User removed successfully');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch {
      setStatusMessage('Failed to remove user');
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };
  
  const handleToggleActive = async (userId: UserId, isActive: boolean) => {
    try {
      await toggleUserActive(userId, isActive);
      setStatusMessage('User status updated successfully');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch {
      setStatusMessage('Failed to update user status');
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };
  
  const handleRoleChange = async (userId: UserId, role: UserRole) => {
    try {
      await changeUserRole(userId, role);
      setStatusMessage('User role updated successfully');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch {
      setStatusMessage('Failed to update user role');
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };
  
  return (
    <div className="user-management">
      <h2>User Management</h2>
      
      {/* Status Message */}
      {statusMessage && (
        <div className="status-message success">
          {statusMessage}
        </div>
      )}
      
      {/* Add User Form */}
      <div className="add-user-form">
        <h3>Add New User</h3>
        <div className="form-row">
          <label htmlFor="name">Name:</label>
          <input 
            type={INPUT_TYPE_ENUM.TEXT} 
            id="name" 
            value={newUserName} 
            onChange={(e) => setNewUserName(e.target.value)}
            placeholder="Enter user name"
          />
        </div>
        <div className="form-row">
          <label htmlFor="department">Department:</label>
          <input 
            type={INPUT_TYPE_ENUM.TEXT} 
            id="department" 
            value={newUserDepartment} 
            onChange={(e) => setNewUserDepartment(e.target.value as Department)}
            placeholder="Enter department"
          />
        </div>
        <div className="form-row">
          <label htmlFor="role">Role:</label>
          <select 
            id="role" 
            value={newUserRole} 
            onChange={(e) => setNewUserRole(e.target.value as UserRole)}
          >
            <option value={USER_ROLE_ENUM.STAFF}>Staff</option>
            <option value={USER_ROLE_ENUM.SPECIALIST}>Specialist</option>
            <option value={USER_ROLE_ENUM.TEAM_LEADER}>Team Leader</option>
            <option value={USER_ROLE_ENUM.READER}>Reader</option>
          </select>
        </div>
        <button onClick={handleAddUser}>Add User</button>
      </div>
      
      {/* User List */}
      <div className="user-list">
        <h3>Users ({allUsers.length})</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Department</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {allUsers.map(user => (
              <tr 
                key={user.id.toString()}
                className={selectedUser?.id === user.id ? 'selected' : ''}
                onClick={() => setSelectedUser(user.id)}
              >
                <td>{user.id.toString()}</td>
                <td>{user.displayName}</td>
                <td>{user.department}</td>
                <td>
                  <select 
                    value={user.authorities}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value={USER_ROLE_ENUM.STAFF}>Staff</option>
                    <option value={USER_ROLE_ENUM.SPECIALIST}>Specialist</option>
                    <option value={USER_ROLE_ENUM.TEAM_LEADER}>Team Leader</option>
                    <option value={USER_ROLE_ENUM.READER}>Reader</option>
                  </select>
                </td>
                <td>
                  <label className="toggle">
                    <input 
                      type={INPUT_TYPE_ENUM.CHECKBOX} 
                      checked={user.enabled}
                      onChange={(e) => handleToggleActive(user.id, e.target.checked)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="slider"></span>
                  </label>
                </td>
                <td>
                  <button 
                    className="delete-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveUser(user.id);
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Selected User Details */}
      {selectedUser && (
        <div className="user-details">
          <h3>Selected User</h3>
          <div className="details-row">
            <span className="label">ID:</span>
            <span className="value">{selectedUser.id.toString()}</span>
          </div>
          <div className="details-row">
            <span className="label">Name:</span>
            <span className="value">{selectedUser.displayName}</span>
          </div>
          <div className="details-row">
            <span className="label">Department:</span>
            <span className="value">{selectedUser.department}</span>
          </div>
          <div className="details-row">
            <span className="label">Role:</span>
            <span className="value">{selectedUser.authorities}</span>
          </div>
          <div className="details-row">
            <span className="label">Status:</span>
            <span className="value">
              {selectedUser.enabled ? STATUS_DISPLAY_ENUM.ACTIVE : STATUS_DISPLAY_ENUM.INACTIVE}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserListComponent; 