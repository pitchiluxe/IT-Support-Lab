import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-muted-foreground">This page does not exist.</p>
        <Link to="/">
          <Button variant="outline">Go home</Button>
        </Link>
      </div>
    </div>
  );
}
