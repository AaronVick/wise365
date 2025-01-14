import { useState } from 'react';
import funnels from '../../data/funnels';
import styles from '../../styles/Admin.module.css';

export default function ImportFunnels() {
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const [successCount, setSuccessCount] = useState(0);
    const [failureCount, setFailureCount] = useState(0);

    const handleImport = async () => {
        setStatus('Processing...');
        setError('');
        setSuccessCount(0);
        setFailureCount(0);

        try {
            const response = await fetch('/api/admin/import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ funnels }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                setStatus('Import completed successfully.');
                setSuccessCount(result.successCount || 0);
                setFailureCount(result.failureCount || 0);
            } else {
                throw new Error(result.message || 'Unknown error occurred during import.');
            }
        } catch (err) {
            setStatus('');
            setError(`Import failed: ${err.message}`);
        }
    };

    return (
        <div className={styles.container}>
            <h1>Import Funnels</h1>
            <p>Click the button below to import funnel data into the database.</p>
            <button className={styles.button} onClick={handleImport}>
                Start Import
            </button>

            {status && <p className={styles.success}>{status}</p>}
            {error && <p className={styles.error}>{error}</p>}

            {(successCount > 0 || failureCount > 0) && (
                <div className={styles.results}>
                    <p>Successful imports: {successCount}</p>
                    <p>Failed imports: {failureCount}</p>
                </div>
            )}
        </div>
    );
}
