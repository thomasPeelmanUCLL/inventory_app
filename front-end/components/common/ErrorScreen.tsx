type ErrorScreenProps = {
    message: string;
    onRetry?: () => void;
};

export default function ErrorScreen({ message, onRetry }: ErrorScreenProps) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="text-red-600 text-xl mb-4">Something went wrong</div>
                <div className="text-gray-600 mb-4">{message}</div>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        Retry
                    </button>
                )}
            </div>
        </div>
    );
}
