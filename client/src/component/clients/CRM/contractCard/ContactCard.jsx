import React from 'react';
import './ContactCard.css';

const ContactCard = ({ contacts }) => {
  return (
    <div className="contacts-grid">
      {contacts.map((contact) => (
        <div key={contact.id} className="contact-card">

          <div className="contact-details">
            <div className="contact-name-container">
              <h3 className="contact-name">{contact.name}</h3>
            </div>
            <div className="detail-row">
              <i className="bi bi-envelope detail-icon"></i>
              <span className="detail-value">{contact.email || 'N/A'}</span>
            </div>

            <div className="detail-row">
              <i className="bi bi-telephone detail-icon"></i>
              <span className="detail-value">{contact.phone || 'N/A'}</span>
            </div>

            <div className="detail-row">
              <i className="bi bi-currency-rupee detail-icon"></i>
              <span className="detail-value amount">₹{contact.amount || '0'}</span>
            </div>

            <div className="detail-row">
              <i className="bi bi-calendar detail-icon"></i>
              <span className="detail-value">
                {contact.when !== 'N/A' ? new Date(contact.when).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                }) : 'N/A'}
              </span>
            </div>
          </div>

        </div>
      ))}
    </div>
  );
};

export default ContactCard;
