export default function StudentDetailSkeleton() {
    return (
        <div>
            <div className="card">
                <div className="skeleton skeleton-title" />

                <div className="skeleton skeleton-bar" />
                <div className="skeleton skeleton-text" />
            </div>

            <ul>
                {[...Array(5)].map((_, i) => (
                    <li key={i} className="skeleton skeleton-item" />
                ))}
            </ul>
        </div>
    );
}
