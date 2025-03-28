import React, { useRef, useState, useEffect } from 'react';
import TopActionBar from '../TopActionBar/TopActionBar';
import ContactCard from '../contractCard/ContactCard';
import './LeadManagment.css';

const LeadManagementView = ({ filters }) => {
    const containerRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [pipelineList, setPipelineList] = useState([]);
    const [selectedPipeline, setSelectedPipeline] = useState(null);
    const [columns, setColumns] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const fetchPipelines = async () => {
            setIsLoading(true);
            try {
                const response = await fetch('https://api.autopilotmybusiness.com/api/stages/list');
                if (!response.ok) throw new Error('Failed to fetch pipelines');
                const data = await response.json();
                setPipelineList(data);

                if (data.length > 0) {
                    setSelectedPipeline(data[0].pipelineName);
                    await updateColumnsFromPipeline(data[0]);
                }
            } catch (error) {
                console.error('Error fetching pipelines:', error);
                setError(error.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPipelines();
    }, []);

    const updateColumnsFromPipeline = async (pipeline) => {
        setIsLoading(true);
        try {
            const response = await fetch('https://api.autopilotmybusiness.com/api/form/leads-by-stages');
            if (!response.ok) throw new Error('Failed to fetch leads');
            const leadsData = await response.json();

            const formattedColumns = pipeline.stages.map((stage) => {
                const matchingStage = leadsData.find(lead => lead.stage === stage.stageName);
                const stageLeads = matchingStage?.leads || [];

                const totalAmount = stageLeads.reduce((sum, lead) => {
                    const amount = parseFloat(lead.data?.amount) || 0;
                    return sum + amount;
                }, 0);

                const contacts = stageLeads.map((lead, i) => ({
                    id: lead.submission_id || `${stage.stageName}-${i}`,
                    name: lead.data?.name || "No Name",
                    phone: lead.data?.phone || "N/A",
                    email: lead.data?.email || "N/A",
                    amount: lead.data?.amount || "0",
                    currentStage: stage.stageName,
                    stageName: stage.stageName,
                    when: lead.submittedAt || 'N/A',
                    showDetails: false
                }));

                return {
                    id: stage._id || stage.stageName,
                    title: stage.stageName,
                    leads: contacts.length,
                    amount: totalAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }),
                    contacts,
                    metadata: {
                        what: stage.what,
                        when: stage.when,
                        who: stage.who,
                        how: stage.how,
                        why: stage.why,
                        priority: stage.priority,
                        status: stage.status,
                        dependencies: stage.dependencies,
                        approvalsRequired: stage.approvalsRequired,
                        notes: stage.notes
                    },
                    showMeta: false
                };
            });

            setColumns(formattedColumns);
        } catch (err) {
            console.error('Error fetching leads:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFilterChange = async (selected) => {
        setSelectedPipeline(selected);
        const pipeline = pipelineList.find(p => p.pipelineName === selected);
        if (pipeline) await updateColumnsFromPipeline(pipeline);
    };

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setStartX(e.pageX - containerRef.current.offsetLeft);
        setScrollLeft(containerRef.current.scrollLeft);
        containerRef.current.classList.add('dragging');
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - containerRef.current.offsetLeft;
        const walk = (x - startX) * 2;
        containerRef.current.scrollLeft = scrollLeft - walk;
    };

    const endDrag = () => {
        setIsDragging(false);
        containerRef.current?.classList?.remove('dragging');
    };

    const moveContact = (contactId, fromColumnId, toColumnId) => {
        if (fromColumnId === toColumnId) return;

        setColumns(prevColumns => {
            const newColumns = [...prevColumns];
            const fromColumnIndex = newColumns.findIndex(col => col.id === fromColumnId);
            const toColumnIndex = newColumns.findIndex(col => col.id === toColumnId);

            if (fromColumnIndex === -1 || toColumnIndex === -1) return prevColumns;

            const contactIndex = newColumns[fromColumnIndex].contacts.findIndex(c => c.id === contactId);
            if (contactIndex === -1) return prevColumns;

            const [movedContact] = newColumns[fromColumnIndex].contacts.splice(contactIndex, 1);
            movedContact.stageName = newColumns[toColumnIndex].title;
            movedContact.currentStage = newColumns[toColumnIndex].title;
            newColumns[toColumnIndex].contacts.push(movedContact);
            newColumns[fromColumnIndex].leads = newColumns[fromColumnIndex].contacts.length;
            newColumns[toColumnIndex].leads = newColumns[toColumnIndex].contacts.length;

            return newColumns;
        });
    };

    const toggleMetadata = (index) => {
        setColumns(prev =>
            prev.map((col, i) =>
                i === index ? { ...col, showMeta: !col.showMeta } : col
            )
        );
    };

    if (error) return <div className="error-message">Error: {error}</div>;
    if (isLoading) return <div className="loading-spinner">Loading...</div>;

    return (
        <div className="lead-management-view">
            <div className="lead-management-header">
                <h2 className="lead-management-title">Lead Pipeline</h2>
                <div className="pipeline-controls">
                    <TopActionBar
                        onFilterChange={handleFilterChange}
                        pipelineList={pipelineList.map(p => p.pipelineName)}
                        selectedPipeline={selectedPipeline}
                    />
                    <div className="stats-summary">
                        <div className="stat-item">
                            <span className="stat-label">Total Pipelines</span>
                            <span className="stat-value">{pipelineList.length}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Active Pipeline</span>
                            <span className="stat-value">{selectedPipeline}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div
                ref={containerRef}
                className="pipeline-container"
                onMouseDown={handleMouseDown}
                onMouseLeave={endDrag}
                onMouseUp={endDrag}
                onMouseMove={handleMouseMove}
            >
                {columns.map((column, index) => (
                    <div key={column.id} className="pipeline-column-wrapper">
                        <div className="pipeline-column">
                            <div className="column-header">
                                <div className="column-title-wrapper">
                                    <h3 className="stage-title">{column.title}</h3>
                                    <div className="stage-stats">
                                        <span className="stage-amount">{column.amount}</span>
                                        <span className="stage-leads">{column.leads} leads</span>
                                    </div>
                                </div>
                                <button
                                    className="toggle-meta-btn"
                                    onClick={() => toggleMetadata(index)}
                                    aria-label={column.showMeta ? 'Hide stage details' : 'Show stage details'}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        {column.showMeta ? (
                                            <path d="M18 15l-6-6-6 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        ) : (
                                            <path d="M6 9l6 6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        )}
                                    </svg>
                                </button>
                            </div>

                            {column.showMeta && (
                                <div className="stage-extras">
                                    {column.metadata.what && <div className="meta-item"><strong>What:</strong> <span>{column.metadata.what}</span></div>}
                                    {column.metadata.when && <div className="meta-item"><strong>When:</strong> <span>{new Date(column.metadata.when).toLocaleDateString('en-GB')}</span></div>}
                                    {column.metadata.who && <div className="meta-item"><strong>Who:</strong> <span>{column.metadata.who}</span></div>}
                                    {column.metadata.how && <div className="meta-item"><strong>How:</strong> <span>{column.metadata.how}</span></div>}
                                    
                                </div>
                            )}

                            <div className="contacts-container">
                                <ContactCard
                                    contacts={column.contacts}
                                    onContactMove={(contactId) => moveContact(contactId, column.id)}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LeadManagementView;