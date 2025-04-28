import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Users,
  Calendar,
  BookOpen,
  BarChart2,
  Settings,
  ChevronRight,
  PlusCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery } from 'convex/react';
import { api } from "../../../convex/_generated/api";
import { toast } from 'sonner';
import { useConvexAuth } from "convex/react";
import { useAuth } from "@clerk/clerk-react";

interface SidebarProps {
  isSidebarOpen: boolean;
}

interface StudyGroupFormData {
  name: string;
  description: string;
  subject: string;
  isPublic: boolean;
}

const Sidebar = ({ isSidebarOpen }: SidebarProps) => {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { userId } = useAuth();

  const create = useMutation(api.studyGroups.create);
  const allGroups = useQuery(api.studyGroups.getAll, {}) || [];
  const [isGroupsExpanded, setIsGroupsExpanded] = useState(true);
  const form = useForm<StudyGroupFormData>({
    defaultValues: {
      name: "",
      description: "",
      subject: "",
      isPublic: true,
    },
  });

  // Filter to show only joined groups where user is a member
  const userGroups = allGroups.filter(group =>
    group.members?.includes(userId)
  );

  const onSubmit = (data: StudyGroupFormData) => {

    const promise = create({ ...data })
    toast.promise(promise, {
      loading: "Creating group...",
      success: () => {
        form.reset();
        setIsGroupsExpanded(false);
        return "Group created successfully!";
      },
      error: "Failed to create group",
    });
  };

  const menuItems = [
    { name: 'Dashboard', icon: Home, path: '/dashboard' },
    { name: 'Calendar', icon: Calendar, path: '/calendar' },
    { name: 'Resources', icon: BookOpen, path: '/resources' },
    { name: 'Progress', icon: BarChart2, path: '/progress' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-20 w-64 bg-white border-r border-gray-200 transition-transform duration-300 transform",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
    >
      <div className="h-full flex flex-col">
        <div className="px-4 py-6">
          <div className="flex flex-col space-y-1 items-start">
            <span className="text-primary font-bold text-xl">StudySync</span>
          </div>
        </div>

        <div className="px-4 py-5 flex-1">
          <div className="flex items-center justify-between mb-2">
            <button
              className="flex items-center text-sm font-medium text-gray-700"
              onClick={() => setIsGroupsExpanded(!isGroupsExpanded)}
            >
              <ChevronRight className={cn("h-4 w-4 transition-transform", isGroupsExpanded && "rotate-90")} />
              <span className="ml-2">Study Groups</span>
            </button>
            <CreateGroupDialog form={form} onSubmit={onSubmit} />
          </div>

          {isGroupsExpanded && (
            <div className="ml-2 space-y-1">
              {!isLoading && userGroups.length > 0 ? (
                userGroups.map((group) => (
                  <Link
                    key={group._id}
                    to={`/groups/${group._id}`}
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                      location.pathname === `/groups/${group._id}`
                        ? "bg-gray-100 text-primary"
                        : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <Users className="mr-3 h-4 w-4 text-gray-500" />
                    <span className="truncate">{group.name}</span>
                  </Link>
                ))
              ) : (
                <div className="text-sm text-gray-500 py-2 px-3">
                  No groups joined
                </div>
              )}

              <Link
                to="/all-groups"
                className="flex items-center px-3 py-2 text-sm font-medium text-primary hover:bg-gray-50 rounded-md"
              >
                <span>View all groups</span>
              </Link>
            </div>
          )}
        </div>

        <div className="px-4 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <CreateGroupDialog form={form} onSubmit={onSubmit} isText={true} />
          </div>
        </div>
      </div>
    </div>
  );
};

function CreateGroupDialog({ form, onSubmit, isText = false }: { form: any, onSubmit: (data: StudyGroupFormData) => void, isText?: boolean }) {
  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          {isText ? <Button className="w-full" size="sm">
            Create Group
            <PlusCircle className="mr-2 h-4 w-4" />
          </Button> : <PlusCircle className="mr-2 h-4 w-4 cursor-pointer" />}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Study Group</DialogTitle>
            <DialogDescription>
              Create a new study group to collaborate with others.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter group name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter subject" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter group description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Public Group</FormLabel>
                      <FormDescription>
                        Anyone can find and join a public group
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Create Group</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default Sidebar;
