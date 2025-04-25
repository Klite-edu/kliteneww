import { useEffect, useState } from 'react';

export const GoogleApi = () => {
    const [gapiLoaded, setGapiLoaded] = useState(false);

    useEffect(() => {
        if (window.gapi) {
            setGapiLoaded(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.async = true;
        script.defer = true;
        script.onload = () => {
            window.gapi.load('client:auth2', () => {
                setGapiLoaded(true);
            });
        };
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    return gapiLoaded;
};