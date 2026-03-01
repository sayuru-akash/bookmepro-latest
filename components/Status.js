// components/Dashboard.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Status = () => {
    const [appointments, setAppointments] = useState([]);
    const [status, setStatus] = useState('pending');

    const fetchAppointments = async (status) => {
        try {
            const response = await axios.get(`/api/appointments/${status}`);
            setAppointments(response.data);
        } catch (error) {
            console.error('Error fetching appointments:', error);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchAppointments(status);
    }, [status]);

    const handleStatusChange = async (id, newStatus) => {
        try {
            await axios.put(`/api/appointments/updateStatus`, { id, status: newStatus });
            fetchAppointments(status); // Refresh appointments list
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    return (
        <div className="dashboard-container">
            <h1>My Bookings</h1>
            <div className="status-tabs">
                {['pending', 'approved', 'rejected'].map((item) => (
                    <button
                        key={item}
                        className={status === item ? 'active' : ''}
                        onClick={() => setStatus(item)}
                    >
                        {item.charAt(0).toUpperCase() + item.slice(1)}
                    </button>
                ))}
            </div>
            <div className="appointments-list">
                {appointments.map((appointment) => (
                    <div key={appointment._id} className="appointment-card">
                        <h2>Name: {appointment.clientName}</h2>
                        <p>Date: {new Date(appointment.bookedAt).toLocaleDateString()}</p>
                        <p>Time: {appointment.time}</p>
                        <p>Status: {appointment.status}</p>
                        <p>Description: {appointment.clientNotes}</p>
                        <div className="contact-buttons">
                            <button>📞 {appointment.clientPhoneNo}</button>
                            <button>📧 {appointment.clientEmail}</button>
                        </div>
                        <div className="status-buttons">
                            <button onClick={() => handleStatusChange(appointment._id, 'approved')}>Approve</button>
                            <button onClick={() => handleStatusChange(appointment._id, 'rejected')}>Reject</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Status;
