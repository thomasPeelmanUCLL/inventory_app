type LoadingScreenProps = {
    message?: string;
};

export default function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-lg text-gray-600">{message}</div>
        </div>
    );
}
