import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BotTrigger = () => {
  const [formData, setFormData] = useState({
    name: '',
    triggerWords: '',
    pipelineId: '',
    stageId: ''
  });
  const [pipelines, setPipelines] = useState([]);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch pipelines
    const fetchPipelines = async () => {
      try {
        const res = await axios.get('/api/triggers');
        setPipelines(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPipelines();
  }, []);

  useEffect(() => {
    // Fetch stages when pipeline is selected
    if (formData.pipelineId) {
      const fetchStages = async () => {
        try {
          const res = await axios.get(`/api/triggers/pipelines/${formData.pipelineId}/stages`);
          setStages(res.data);
        } catch (err) {
          console.error(err);
        }
      };
      fetchStages();
    }
  }, [formData.pipelineId]);

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      // Convert triggerWords string to array
      const triggerWordsArray = formData.triggerWords
        .split(',')
        .map(word => word.trim())
        .filter(word => word.length > 0);
      
      const payload = {
        ...formData,
        triggerWords: triggerWordsArray
      };

      await axios.post('/api/triggers', payload);
      alert('Trigger created successfully!');
      setFormData({
        name: '',
        triggerWords: '',
        pipelineId: '',
        stageId: ''
      });
    } catch (err) {
      console.error(err);
      alert('Error creating trigger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <h2>Create New Trigger</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Trigger Name</label>
          <input
            type="text"
            className="form-control"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="mb-3">
          <label className="form-label">Trigger Words (comma separated)</label>
          <input
            type="text"
            className="form-control"
            name="triggerWords"
            value={formData.triggerWords}
            onChange={handleChange}
            placeholder="e.g. book demo, demo chahiye, schedule demo"
            required
          />
        </div>
        
        <div className="mb-3">
          <label className="form-label">Pipeline</label>
          <select
            className="form-select"
            name="pipelineId"
            value={formData.pipelineId}
            onChange={handleChange}
            required
          >
            <option value="">Select Pipeline</option>
            {pipelines.map(pipeline => (
              <option key={pipeline._id} value={pipeline._id}>
                {pipeline.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="mb-3">
          <label className="form-label">Stage</label>
          <select
            className="form-select"
            name="stageId"
            value={formData.stageId}
            onChange={handleChange}
            required
            disabled={!formData.pipelineId}
          >
            <option value="">Select Stage</option>
            {stages.map(stage => (
              <option key={stage._id} value={stage._id}>
                {stage.name}
              </option>
            ))}
          </select>
        </div>
        
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Creating...' : 'Create Trigger'}
        </button>
      </form>
    </div>
  );
};

export default BotTrigger;