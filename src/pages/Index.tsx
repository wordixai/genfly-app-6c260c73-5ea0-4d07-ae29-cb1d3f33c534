import JsonViewer from '@/components/JsonViewer';
import { Toaster } from '@/components/ui/toaster';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <JsonViewer />
      <Toaster />
    </div>
  );
};

export default Index;