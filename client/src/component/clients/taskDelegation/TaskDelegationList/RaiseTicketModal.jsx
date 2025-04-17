import React, { useState } from "react";
import "./delegationlist.css"; // Reuse the same CSS or create a new one

const RaiseTicketModal = ({ 
  showModal, 
  onClose, 
  onSubmit, 
  ticketData, 
  onInputChange 
}) => {
  if (!showModal) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Create New Ticket</h3>
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              name="title"
              value={ticketData.title}
              onChange={onInputChange}
              required
              disabled
            />
          </div>

          <div className="form-group">
            <label>Category</label>
            <select
              name="category"
              value={ticketData.category}
              onChange={onInputChange}
              required
            >
              <option value="Task Delegation">Task Delegation</option>
              <option value="Checklist">Checklist</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Type</label>
            <select
              name="type"
              value={ticketData.type}
              onChange={onInputChange}
              required
            >
              <option value="Help">Help</option>
              <option value="Issue">Issue</option>
              <option value="Request">Request</option>
            </select>
          </div>

          <div className="form-group">
            <label>Priority</label>
            <select
              name="priority"
              value={ticketData.priority}
              onChange={onInputChange}
              required
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={ticketData.description}
              onChange={onInputChange}
              required
              rows="5"
              placeholder="Describe your issue in detail..."
            />
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn red"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="btn green">
              Submit Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RaiseTicketModal;