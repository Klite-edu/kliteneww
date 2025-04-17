import React, { useState, useEffect } from 'react';
import './ContactPopup.css';
import axios from 'axios';
import { useNavigate } from "react-router-dom";

const ContactPopup = ({ contact, onClose, stageDetails, pipelineId, leadId, stageId }) => {
    console.log(`stage Details - `, stageDetails);
    console.log(`leadId - ${leadId}`);

    const [activeForm, setActiveForm] = useState(null);
    const [tasks, setTasks] = useState([
        { id: 1, text: 'fdsdfs\nsdfsdfs', completed: false, createdAt: '02/04/2025 04:10 pm', dueDate: '10/04/2025 06:12 pm' },
        { id: 2, text: 'Follow-up title\nDescription', completed: false, createdAt: '20/03/2025 02:29 pm' },
        { id: 3, text: 'Follow-up Description', completed: false, createdAt: '20/03/2025 02:29 pm' }
    ]);

    const [newTask, setNewTask] = useState('');
    const [newDueDate, setNewDueDate] = useState('');
    const [notes, setNotes] = useState([
        { id: 1, title: 'Meeting Notes', content: 'Discussed project requirements', createdAt: '09/04/2025 02:48 pm' }
    ]);

    const [appointments, setAppointments] = useState([]);
    const [checklist, setChecklist] = useState([]);

    const navigate = useNavigate();
    const [token, setToken] = useState("");
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const tokenRes = await axios.get(
                    `${process.env.REACT_APP_API_URL}/api/permission/get-token`,
                    { withCredentials: true }
                );

                const userToken = tokenRes.data.token;
                if (!userToken) {
                    navigate("/");
                    return;
                }

                setToken(userToken);
            } catch (error) {
                console.error("Error fetching initial data:", error);
                navigate("/");
            }
        };

        fetchInitialData();
    }, [navigate]);

    useEffect(() => {
        if (stageDetails?.checklist) {
            // Process checklist items to mark them as locked if they're completed
            const processedChecklist = stageDetails.checklist.map(item => {
                // Check if this item has a completed ticket for the current lead
                const isCompletedForLead = item.ticket?.some(ticket =>
                    ticket.id === leadId && ticket.completedTime
                );

                return {
                    ...item,
                    id: item._id, // Use the _id from database
                    locked: isCompletedForLead // Lock if completed for this lead
                };
            });
            setChecklist(processedChecklist);
        }
    }, [stageDetails, leadId]);

    const [opportunityForm, setOpportunityForm] = useState({
        name: '',
        stage: 'Prospecting',
        amount: ''
    });

    const [additionalInfoForm, setAdditionalInfoForm] = useState({
        type: 'Company Details',
        details: ''
    });

    const [notesForm, setNotesForm] = useState({
        title: '',
        content: ''
    });

    const [appointmentForm, setAppointmentForm] = useState({
        title: '',
        dateTime: '',
        location: '',
        description: ''
    });

    if (!contact) return null;

    const handleButtonClick = (formType) => {
        setActiveForm(formType);
    };

    const handleTaskToggle = (taskId) => {
        setTasks(tasks.map(task =>
            task.id === taskId ? { ...task, completed: !task.completed } : task
        ));
    };

    const handleChecklistToggle = async (itemId) => {
        const itemToUpdate = checklist.find(item => item._id === itemId);

        // Don't allow toggling if the item is locked (already completed)
        if (itemToUpdate.locked) {
            return;
        }

        const updatedChecklist = checklist.map(item => {
            if (item._id === itemId) {
                return {
                    ...item,
                    completed: !item.completed,
                    completedTime: !item.completed
                        ? new Date().toLocaleString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                        })
                        : null
                };
            }
            return item;
        });

        setChecklist(updatedChecklist);

        const updatedItem = updatedChecklist.find(item => item._id === itemId);

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/stages/pipeline/checklist`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: JSON.stringify({
                    checklistItemId: updatedItem._id,
                    leadId,
                    stageId,
                    pipelineId,
                    isCompleted: updatedItem.completed,
                    contact,
                    stageDetails,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to update checklist item');
            }

            const data = await response.json();
            console.log('Checklist item updated successfully:', data);

            // If the update was successful and the item is now completed, lock it
            if (updatedItem.completed) {
                setChecklist(checklist.map(item =>
                    item._id === itemId ? { ...item, locked: true } : item
                ));
            }
        } catch (error) {
            console.error('Error updating checklist item:', error);
            setChecklist(checklist); // Revert on error
        }
    };

    const handleAddTask = () => {
        if (newTask.trim()) {
            const newTaskObj = {
                id: Date.now(),
                text: newTask,
                completed: false,
                createdAt: new Date().toLocaleString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                }),
                dueDate: newDueDate ? new Date(newDueDate).toLocaleString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                }) : ''
            };
            setTasks([...tasks, newTaskObj]);
            setNewTask('');
            setNewDueDate('');
        }
    };

    const handleDeleteTask = (taskId) => {
        setTasks(tasks.filter(task => task.id !== taskId));
    };

    const handleDeleteNote = (noteId) => {
        setNotes(notes.filter(note => note.id !== noteId));
    };

    const handleDeleteAppointment = (appointmentId) => {
        setAppointments(appointments.filter(appt => appt.id !== appointmentId));
    };

    const calculateProgress = (items) => {
        if (!items || items.length === 0) return 0;
        const completedItems = items.filter(item => item.completed || item.locked).length;
        return Math.round((completedItems / items.length) * 100);
    };

    const tasksProgress = calculateProgress(tasks);
    const checklistProgress = calculateProgress(checklist);

    const handleOpportunitySubmit = (e) => {
        e.preventDefault();
        console.log('Opportunity submitted:', opportunityForm);
    };

    const handleAdditionalInfoSubmit = (e) => {
        e.preventDefault();
        console.log('Additional info submitted:', additionalInfoForm);
    };

    const handleNotesSubmit = (e) => {
        e.preventDefault();
        const newNote = {
            id: Date.now(),
            title: notesForm.title,
            content: notesForm.content,
            createdAt: new Date().toLocaleString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            })
        };
        setNotes([...notes, newNote]);
        setNotesForm({ title: '', content: '' });
    };

    const handleAppointmentSubmit = (e) => {
        e.preventDefault();
        const newAppointment = {
            id: Date.now(),
            title: appointmentForm.title,
            dateTime: new Date(appointmentForm.dateTime).toLocaleString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }),
            location: appointmentForm.location,
            description: appointmentForm.description,
            createdAt: new Date().toLocaleString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            })
        };
        setAppointments([...appointments, newAppointment]);
        setAppointmentForm({
            title: '',
            dateTime: '',
            location: '',
            description: ''
        });
    };

    const renderForm = () => {
        switch (activeForm) {
            case 'opportunity':
                return (
                    <div className="contactpopup-form-container">
                        <h4 className="contactpopup-form-title">Opportunity</h4>
                        <div className="two-column-layout">
                            <div className="column">
                                <div className="opportunity-list">
                                    <p>No opportunities found</p>
                                </div>
                            </div>
                            <div className="column">
                                <form className="opportunity-form" onSubmit={handleOpportunitySubmit}>
                                    <div className="form-group">
                                        <label>Opportunity Name*</label>
                                        <input
                                            type="text"
                                            placeholder="Enter opportunity name"
                                            value={opportunityForm.name}
                                            onChange={(e) => setOpportunityForm({ ...opportunityForm, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Stage*</label>
                                        <select
                                            value={opportunityForm.stage}
                                            onChange={(e) => setOpportunityForm({ ...opportunityForm, stage: e.target.value })}
                                        >
                                            <option value="Prospecting">Prospecting</option>
                                            <option value="Qualification">Qualification</option>
                                            <option value="Proposal">Proposal</option>
                                            <option value="Negotiation">Negotiation</option>
                                            <option value="Closed Won">Closed Won</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Amount</label>
                                        <input
                                            type="number"
                                            placeholder="Enter amount"
                                            value={opportunityForm.amount}
                                            onChange={(e) => setOpportunityForm({ ...opportunityForm, amount: e.target.value })}
                                        />
                                    </div>
                                    <button type="submit" className="save-button">Save Opportunity</button>
                                </form>
                            </div>
                        </div>
                        <div className="contactpopup-footer">
                            <span>Created On: 20/03/2025 14:29 PM</span>
                        </div>
                    </div>
                );

            case 'additional-info':
                return (
                    <div className="contactpopup-form-container">
                        <h4 className="contactpopup-form-title">Additional Info</h4>
                        <div className="two-column-layout">
                            <div className="column">
                                <div className="info-display">
                                    <p>No additional information available</p>
                                </div>
                            </div>
                            <div className="column">
                                <form className="info-form" onSubmit={handleAdditionalInfoSubmit}>
                                    <div className="form-group">
                                        <label>Info Type*</label>
                                        <select
                                            value={additionalInfoForm.type}
                                            onChange={(e) => setAdditionalInfoForm({ ...additionalInfoForm, type: e.target.value })}
                                        >
                                            <option value="Company Details">Company Details</option>
                                            <option value="Personal Details">Personal Details</option>
                                            <option value="Preferences">Preferences</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Details</label>
                                        <textarea
                                            placeholder="Enter additional information"
                                            value={additionalInfoForm.details}
                                            onChange={(e) => setAdditionalInfoForm({ ...additionalInfoForm, details: e.target.value })}
                                        ></textarea>
                                    </div>
                                    <button type="submit" className="save-button">Save Info</button>
                                </form>
                            </div>
                        </div>
                        <div className="contactpopup-footer">
                            <span>Created On: 20/03/2025 14:29 PM</span>
                        </div>
                    </div>
                );

            case 'call-logs':
                return (
                    <div className="contactpopup-form-container">
                        <h4 className="contactpopup-form-title">Call Logs</h4>
                        <div className="call-logs-container">
                            <div className="call-logs-header">
                                <span>Status</span>
                                <span>Type</span>
                                <span>Handled By</span>
                                <span>Employee Status</span>
                                <span>Call Duration</span>
                                <span>Listen</span>
                                <span>Date/Time</span>
                            </div>
                            <div className="call-logs-content">
                                <p>No logs yet</p>
                            </div>
                            <div className="contactpopup-footer">
                                <span>Created On: 20/03/2025 14:29 PM</span>
                                <button className="delete-button">DELETE</button>
                            </div>
                        </div>
                    </div>
                );

            case 'follow-up':
                return (
                    <div className="contactpopup-form-container">
                        <h4 className="contactpopup-form-title">Follow-up</h4>

                        <div className="progress-container">
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${tasksProgress}%` }}
                                ></div>
                            </div>
                            <span className="progress-text">{tasksProgress}% completed</span>
                        </div>

                        <div className="two-column-layout">
                            <div className="column">
                                <div className="follow-up-tasks">
                                    <h5>Follow-up Tasks</h5>
                                    {tasks.length === 0 ? (
                                        <p>No tasks yet</p>
                                    ) : (
                                        tasks.map(task => (
                                            <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                                                <input
                                                    type="checkbox"
                                                    id={`task-${task.id}`}
                                                    checked={task.completed}
                                                    onChange={() => handleTaskToggle(task.id)}
                                                />
                                                <label htmlFor={`task-${task.id}`}>
                                                    {task.text.split('\n').map((line, i) => (
                                                        <React.Fragment key={i}>
                                                            {line}
                                                            <br />
                                                        </React.Fragment>
                                                    ))}
                                                </label>
                                                <div className="task-dates">
                                                    <span>Created On: {task.createdAt}</span>
                                                    {task.dueDate && <span>Due On: {task.dueDate}</span>}
                                                </div>
                                                <button
                                                    className="task-delete-button"
                                                    onClick={() => handleDeleteTask(task.id)}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="column">
                                <div className="follow-up-form">
                                    <div className="form-group">
                                        <label>Add New Task*</label>
                                        <textarea
                                            value={newTask}
                                            onChange={(e) => setNewTask(e.target.value)}
                                            placeholder="Enter task description"
                                        ></textarea>
                                    </div>

                                    <div className="form-group">
                                        <label>Due Date</label>
                                        <input
                                            type="datetime-local"
                                            value={newDueDate}
                                            onChange={(e) => setNewDueDate(e.target.value)}
                                        />
                                    </div>

                                    <button
                                        className="save-button"
                                        onClick={handleAddTask}
                                    >
                                        Add Task
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="contactpopup-footer">
                            <span>Created On: 20/03/2025 14:29 PM</span>
                        </div>
                    </div>
                );

            case 'notes':
                return (
                    <div className="contactpopup-form-container">
                        <h4 className="contactpopup-form-title">Notes</h4>
                        <div className="two-column-layout">
                            <div className="column">
                                <div className="notes-list">
                                    {notes.length === 0 ? (
                                        <p>No notes yet</p>
                                    ) : (
                                        notes.map(note => (
                                            <div key={note.id} className="note-item">
                                                <h5>{note.title}</h5>
                                                <p>{note.content.split('\n').map((line, i) => (
                                                    <React.Fragment key={i}>
                                                        {line}
                                                        <br />
                                                    </React.Fragment>
                                                ))}</p>
                                                <span>Created On: {note.createdAt}</span>
                                                <button
                                                    className="note-delete-button"
                                                    onClick={() => handleDeleteNote(note.id)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                            <div className="column">
                                <form className="notes-form" onSubmit={handleNotesSubmit}>
                                    <div className="form-group">
                                        <label>Title*</label>
                                        <input
                                            type="text"
                                            placeholder="Enter note title"
                                            value={notesForm.title}
                                            onChange={(e) => setNotesForm({ ...notesForm, title: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Write Notes*</label>
                                        <textarea
                                            placeholder="Enter your notes"
                                            value={notesForm.content}
                                            onChange={(e) => setNotesForm({ ...notesForm, content: e.target.value })}
                                            required
                                        ></textarea>
                                    </div>
                                    <button type="submit" className="save-button">Save Note</button>
                                </form>
                            </div>
                        </div>
                        <div className="contactpopup-footer">
                            <span>Created On: 20/03/2025 14:29 PM</span>
                        </div>
                    </div>
                );

            case 'appointments':
                return (
                    <div className="contactpopup-form-container">
                        <h4 className="contactpopup-form-title">Appointments</h4>
                        <div className="two-column-layout">
                            <div className="column">
                                <div className="appointments-tabs">
                                    <button className="active">Upcoming</button>
                                    <button>Past</button>
                                    <button>Date Range</button>
                                    <button>Canceled</button>
                                </div>
                                <div className="appointments-list">
                                    {appointments.length === 0 ? (
                                        <p>No event found!</p>
                                    ) : (
                                        appointments.map(appt => (
                                            <div key={appt.id} className="appointment-item">
                                                <h5>{appt.title}</h5>
                                                <p><strong>When:</strong> {appt.dateTime}</p>
                                                {appt.location && <p><strong>Where:</strong> {appt.location}</p>}
                                                {appt.description && <p>{appt.description}</p>}
                                                <span>Created On: {appt.createdAt}</span>
                                                <button
                                                    className="appointment-delete-button"
                                                    onClick={() => handleDeleteAppointment(appt.id)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                            <div className="column">
                                <form className="appointment-form" onSubmit={handleAppointmentSubmit}>
                                    <div className="form-group">
                                        <label>Title*</label>
                                        <input
                                            type="text"
                                            placeholder="Enter appointment title"
                                            value={appointmentForm.title}
                                            onChange={(e) => setAppointmentForm({ ...appointmentForm, title: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Date & Time*</label>
                                        <input
                                            type="datetime-local"
                                            value={appointmentForm.dateTime}
                                            onChange={(e) => setAppointmentForm({ ...appointmentForm, dateTime: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Location</label>
                                        <input
                                            type="text"
                                            placeholder="Enter location"
                                            value={appointmentForm.location}
                                            onChange={(e) => setAppointmentForm({ ...appointmentForm, location: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Description</label>
                                        <textarea
                                            placeholder="Enter description"
                                            value={appointmentForm.description}
                                            onChange={(e) => setAppointmentForm({ ...appointmentForm, description: e.target.value })}
                                        ></textarea>
                                    </div>
                                    <button type="submit" className="save-button">Schedule Appointment</button>
                                </form>
                            </div>
                        </div>
                    </div>
                );

            case 'checklist':
                return (
                    <div className="contactpopup-form-container">
                        <h4 className="contactpopup-form-title">Checklist</h4>



                        <div className="progress-container">
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${checklistProgress}%` }}
                                ></div>
                            </div>
                            <span className="progress-text">{checklistProgress}% completed</span>
                        </div>

                        <div className="checklist-items-container">
                            {checklist.length === 0 ? (
                                <p>No checklist items yet</p>
                            ) : (
                                checklist.map(item => {
                                    // Find the ticket for this lead
                                    const leadTicket = item.ticket?.find(t => t.id === leadId);
                                    const completedTime = leadTicket?.completedTime
                                        ? new Date(leadTicket.completedTime).toLocaleString('en-GB', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            hour12: true
                                        })
                                        : null;

                                    return (
                                        <div key={item._id} className={`checklist-item ${item.completed || item.locked ? 'completed' : ''}`}>
                                            <input
                                                type="checkbox"
                                                id={`checklist-${item._id}`}
                                                checked={item.completed || item.locked}
                                                onChange={() => handleChecklistToggle(item._id)}
                                                disabled={item.locked}
                                            />
                                            <label htmlFor={`checklist-${item._id}`}>
                                                {item.task}
                                                {item.locked && (
                                                    <span className="checkmark"> ✓</span>
                                                )}
                                            </label>
                                            {(completedTime || item.locked) && (
                                                <span className="completed-time">
                                                    Completed: {completedTime || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div className="contactpopup-footer">
                            <span>Created On: {new Date(stageDetails?.createdAt || new Date()).toLocaleString('en-GB', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                            })}</span>
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="contactpopup-placeholder">
                        <p>Select an option to get started</p>
                    </div>
                );
        }
    };

    return (
        <div className="contactpopup-overlay" onClick={onClose}>
            <div className="contactpopup-popup" onClick={(e) => e.stopPropagation()}>
                <div className="contactpopup-header-container">
                    <div className="contactpopup-card-header">
                        <span className="contactpopup-header-content">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
                            </svg>
                            Add opportunities
                        </span>
                        <button className="contactpopup-close-button" onClick={onClose}>
                            &times;
                        </button>
                    </div>

                    <div className="contactpopup-action-buttons">
                        <button
                            className={`contactpopup-action-button ${activeForm === 'opportunity' ? 'active' : ''}`}
                            onClick={() => handleButtonClick('opportunity')}
                        >
                            Opportunity
                        </button>
                        <button
                            className={`contactpopup-action-button ${activeForm === 'additional-info' ? 'active' : ''}`}
                            onClick={() => handleButtonClick('additional-info')}
                        >
                            Additional Info
                        </button>
                        <button
                            className={`contactpopup-action-button ${activeForm === 'call-logs' ? 'active' : ''}`}
                            onClick={() => handleButtonClick('call-logs')}
                        >
                            Call Logs
                        </button>
                        <button
                            className={`contactpopup-action-button ${activeForm === 'follow-up' ? 'active' : ''}`}
                            onClick={() => handleButtonClick('follow-up')}
                        >
                            Follow-up
                        </button>
                        <button
                            className={`contactpopup-action-button ${activeForm === 'notes' ? 'active' : ''}`}
                            onClick={() => handleButtonClick('notes')}
                        >
                            Notes
                        </button>
                        <button
                            className={`contactpopup-action-button ${activeForm === 'appointments' ? 'active' : ''}`}
                            onClick={() => handleButtonClick('appointments')}
                        >
                            Appointments
                        </button>
                        <button
                            className={`contactpopup-action-button ${activeForm === 'checklist' ? 'active' : ''}`}
                            onClick={() => handleButtonClick('checklist')}
                        >
                            Checklist
                        </button>
                    </div>
                </div>

                <div className="contactpopup-content-area">
                    {renderForm()}
                </div>
            </div>
        </div>
    );
};

export default ContactPopup;