import { useNavigate } from 'react-router-dom';
import {
    Users,
    BookOpen,
    Plus,
    Lock,
    Unlock,

} from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';


function AllGroups() {
    const allGroups = useQuery(api.studyGroups.getAll, {});
    const navigate = useNavigate();
    return (
        <DashboardLayout>
            <div className="flex flex-col space-y-6">
                <div className="flex justify-between items-start">
                    <h1 className="text-2xl font-bold">Study Groups</h1>
                    <Button onClick={() => navigate('/create-group')}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create New Group
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {allGroups?.map((group) => (
                        <Card key={group._id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/groups/${group._id}`)}>
                            <CardHeader>
                                <div className="flex items-center space-x-2">
                                    <CardTitle>{group.name}</CardTitle>
                                    {group.isPublic ? (
                                        <Badge variant="outline" className="flex items-center text-gray-500">
                                            <Unlock className="h-3 w-3 mr-1" />
                                            Public
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="flex items-center text-gray-500">
                                            <Lock className="h-3 w-3 mr-1" />
                                            Private
                                        </Badge>
                                    )}
                                </div>
                                <CardDescription>{group.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between text-sm text-gray-500">
                                    <div className="flex items-center">
                                        <BookOpen className="h-4 w-4 mr-1" />
                                        {group.subject}
                                    </div>
                                    <div className="flex items-center">
                                        <Users className="h-4 w-4 mr-1" />
                                        {group.members.length} members
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}

export default AllGroups