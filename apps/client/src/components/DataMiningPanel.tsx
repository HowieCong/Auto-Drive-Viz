import { useState } from 'react';

interface SearchResult {
    frameId: number;
    score: number;
    description: string;
}

interface DataMiningPanelProps {
    onJumpToFrame: (frameId: number) => void;
}

export function DataMiningPanel({ onJumpToFrame }: DataMiningPanelProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        if (!query) return;
        setLoading(true);
        try {
            const res = await fetch('http://localhost:3000/points/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });
            const data = await res.json();
            setResults(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ 
            padding: '15px', 
            background: '#222', 
            color: 'white', 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '10px' 
        }}>
            <h3>Data Mining (CLIP/LLM)</h3>
            <div style={{ display: 'flex', gap: '5px' }}>
                <input 
                    type="text" 
                    value={query} 
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Describe scene (e.g. 'pedestrian')"
                    style={{ flex: 1, padding: '5px' }}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
                <button onClick={handleSearch} disabled={loading}>
                    {loading ? 'Searching...' : 'Search'}
                </button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {results.map((res, i) => (
                    <div 
                        key={i}
                        onClick={() => onJumpToFrame(res.frameId)}
                        style={{ 
                            padding: '10px', 
                            background: '#333', 
                            cursor: 'pointer', 
                            borderRadius: '4px',
                            borderLeft: `4px solid rgba(0, 255, 0, ${res.score})`
                        }}
                    >
                        <div style={{ fontWeight: 'bold' }}>Frame {res.frameId}</div>
                        <div style={{ fontSize: '0.9em', color: '#ccc' }}>{res.description}</div>
                        <div style={{ fontSize: '0.8em', color: '#888' }}>Score: {res.score.toFixed(2)}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
