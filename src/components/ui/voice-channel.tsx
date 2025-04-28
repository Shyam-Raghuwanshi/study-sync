import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { VoiceRoom } from '../AudioRoom';
import { cn } from '@/lib/utils';

interface VoiceChannelProps {
  groupId: any;
  className?: string;
}

export function VoiceChannel({ groupId, className }: VoiceChannelProps) {

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="text-md">Voice Channel</CardTitle>
        <CardDescription>Currently in a voice channel</CardDescription>
      </CardHeader>
      <CardContent>
        <VoiceRoom
          groupId={groupId}
        />
      </CardContent>
    </Card>
  );

}