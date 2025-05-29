import React, { useState, useEffect } from 'react';
import { useUsers } from '../hooks/useUsers';
import { UserRole } from '../types/types';
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
    changeUserRole,
    isSuccess,
    clearStatus
  } = useUsers();
  
  const [newUserName, setNewUserName] = useState('');
  const [newUserDepartment, setNewUserDepartment] = useState<Department>(Department.Claims);
  const [newUserRole, setNewUserRole] = useState<UserRole>(USER_ROLE_ENUM.STAFF);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  
  // Clear status message after 3 seconds
  useEffect(() => {
    if (isSuccess) {
      setStatusMessage('Operation successful');
      const timer = setTimeout(() => {
        setStatusMessage(null);
        clearStatus();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, clearStatus]);
  
  const handleAddUser = () => {
    if (!newUserName.trim()) return;
    
    const newUser = {
      displayName: newUserName,
      department: newUserDepartment,
      authorities: newUserRole,
      enabled: true,
      initials: newUserName.split(' ').map(part => part[0]).join('')
    };
    
    createUser(newUser);
    
    // Reset form
    setNewUserName('');
    setNewUserDepartment(Department.Claims);
    setNewUserRole(USER_ROLE_ENUM.STAFF);
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
                    onChange={(e) => changeUserRole(user.id, e.target.value as UserRole)}
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
                      onChange={() => toggleUserActive(user.id, !user.enabled)}
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
                      removeUser(user.id);
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