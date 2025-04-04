import React, { useState } from 'react';

const ContactPopup = ({ contact, onClose }) => {
    const [activeForm, setActiveForm] = useState(null);

    if (!contact) return null;

    const handleButtonClick = (formType) => {
        setActiveForm(formType);
    };

    // Styles
    const styles = {
        overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        },
        popup: {
            backgroundColor: 'white',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
        },
        cardHeader: {
            padding: '15px 20px',
            backgroundColor: '#4a6fa5',
            color: 'white',
            borderRadius: '8px 8px 0 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        },
        closeButton: {
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '20px',
            cursor: 'pointer'
        },
        actionButtons: {
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            padding: '15px',
            borderBottom: '1px solid #eee'
        },
        actionButton: (active) => ({
            padding: '8px 15px',
            border: '1px solid #ddd',
            backgroundColor: active ? '#4a6fa5' : 'white',
            color: active ? 'white' : '#333',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontSize: '14px'
        }),
        formContainer: {
            padding: '20px',
            borderRadius: '8px',
            backgroundColor: '#f8f9fa',
            marginTop: '15px'
        },
        input: {
            width: '100%',
            padding: '10px',
            margin: '8px 0',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px'
        },
        button: {
            padding: '10px 20px',
            backgroundColor: '#4a6fa5',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '10px'
        },
        formTitle: {
            marginBottom: '15px',
            color: '#333'
        },
        label: {
            display: 'block',
            marginBottom: '5px'
        }
    };

    const renderForm = () => {
        switch (activeForm) {
            case 'call':
                return (
                    <div style={styles.formContainer}>
                        <h4 style={styles.formTitle}>Schedule Call</h4>
                        <form>
                            <label style={styles.label}>Date</label>
                            <input type="date" style={styles.input} />
                            
                            <label style={styles.label}>Time</label>
                            <input type="time" style={styles.input} />
                            
                            <label style={styles.label}>Notes</label>
                            <textarea style={{ ...styles.input, minHeight: '80px' }} rows="3"></textarea>
                            
                            <button type="button" style={styles.button}>Schedule</button>
                        </form>
                    </div>
                );
            case 'email':
                return (
                    <div style={styles.formContainer}>
                        <h4 style={styles.formTitle}>Send Email</h4>
                        <form>
                            <label style={styles.label}>Subject</label>
                            <input type="text" style={styles.input} />
                            
                            <label style={styles.label}>Message</label>
                            <textarea style={{ ...styles.input, minHeight: '120px' }} rows="5"></textarea>
                            
                            <button type="button" style={styles.button}>Send</button>
                        </form>
                    </div>
                );
            case 'note':
                return (
                    <div style={styles.formContainer}>
                        <h4 style={styles.formTitle}>Add Note</h4>
                        <form>
                            <label style={styles.label}>Note</label>
                            <textarea style={{ ...styles.input, minHeight: '150px' }} rows="5"></textarea>
                            
                            <button type="button" style={styles.button}>Save</button>
                        </form>
                    </div>
                );
            default:
                return (
                    <div style={{ 
                        padding: '20px', 
                        textAlign: 'center', 
                        color: '#666',
                        marginTop: '15px'
                    }}>
                        <p>Select an option to get started</p>
                    </div>
                );
        }
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.popup} onClick={(e) => e.stopPropagation()}>
                <div style={styles.cardHeader}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                        </svg>
                        Add opportunities
                    </span>
                    <button style={styles.closeButton} onClick={onClose}>
                        &times;
                    </button>
                </div>
                
                <div style={styles.actionButtons}>
                    <button 
                        style={styles.actionButton(activeForm === 'call')}
                        onClick={() => handleButtonClick('call')}
                    >
                        Opportunity
                    </button>
                    <button 
                        style={styles.actionButton(activeForm === 'email')}
                        onClick={() => handleButtonClick('email')}
                    >
                        Additional Info
                    </button>
                    <button className='disable'
                        style={styles.actionButton(activeForm === 'Call logs')}
                        onClick={() => handleButtonClick('note')}
                    >
                        Call logs
                    </button>
                    <button 
                        style={styles.actionButton(activeForm === 'Follow-up')}
                        onClick={() => handleButtonClick('call')}
                    >
                        Follow-up
                    </button>
                    <button 
                        style={styles.actionButton(activeForm === 'Notes')}
                        onClick={() => handleButtonClick('email')}
                    >
                        Notes
                    </button>
                    <button 
                        style={styles.actionButton(activeForm === 'Appointments')}
                        onClick={() => handleButtonClick('note')}
                    >
                        Appointments
                    </button>
                </div>

                {renderForm()}
            </div>
        </div>
    );
};

export default ContactPopup;