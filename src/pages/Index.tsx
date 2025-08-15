import JsonEditor from '@/components/JsonEditor';
import { Toaster } from '@/components/ui/toaster';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <JsonEditor />
      <Toaster />
    </div>
  );
};

export default Index;