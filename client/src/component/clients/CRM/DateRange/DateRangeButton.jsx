import React, { useState, useCallback } from 'react';
import moment from 'moment';
import 'bootstrap-daterangepicker/daterangepicker.css';
import DateRangePicker from 'react-bootstrap-daterangepicker';
import './DateRange.css';

const DateRangeButton = () => {
    const [dateRange, setDateRange] = useState('Select Date Range');

    const handleApply = useCallback((event, picker) => {
        event.preventDefault();
        const startDate = picker.startDate.format('MM/DD/YYYY');
        const endDate = picker.endDate.format('MM/DD/YYYY');
        setDateRange(`${startDate} - ${endDate}`); // ✅ Corrected template literal
    }, []);

    const ranges = {
        Today: [moment().clone(), moment().clone()],
        Yesterday: [
            moment().clone().subtract(1, 'days'),
            moment().clone().subtract(1, 'days')
        ],
        'Last 7 Days': [
            moment().clone().subtract(6, 'days'),
            moment().clone()
        ],
        'Last 30 Days': [
            moment().clone().subtract(29, 'days'),
            moment().clone()
        ],
        'This Month': [
            moment().clone().startOf('month'),
            moment().clone().endOf('month')
        ],
        'Last Month': [
            moment().clone().subtract(1, 'month').startOf('month'),
            moment().clone().subtract(1, 'month').endOf('month')
        ]
    };

    return (
        <div className="text-center ">
            <DateRangePicker
                onApply={handleApply}
                initialSettings={{
                    startDate: moment().startOf('day'),
                    endDate: moment().endOf('day'),
                    ranges: ranges
                }}
            >
                <button
                    type="button"
                    className="btn filter-select"
                    style={{
                        background: 'var(--gray)',
                        color: 'var(--primary-color)',
                        boxShadow: 'var(--box-shadow-primary)',
                        borderColor: 'var(--primary-color)',
                        borderWidth: '2px',
                    }}
                >
                    {dateRange}
                </button>
            </DateRangePicker>
        </div>
    );
};

export default DateRangeButton;
