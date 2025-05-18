'use client';

import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Users,
  Calendar,
  Clock,
  ChevronLeft,
  Edit2,
  Check,
  X
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { userService } from '@/lib/services';
import { User as UserType } from '@/lib/types';
import { useAuth } from '@/hooks/auth';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Link from 'next/link';
import { ProfilePhotoUploadDialog } from "@/components/profile/profile-photo-upload-dialog";

interface ProfilePageProps {
  params: {
    id: string;
  };
}

// Form state for editable fields with additional temporary fields
interface FormData extends Partial<UserType> {
  _skillsString?: string;
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const { id } = params;
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  // Form state for editable fields
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    avatar: null,
    role: '',
    department: '',
    team: '',
    location: '',
    phone: '',
    bio: '',
    skills: []
  });
  
  // Check if the current user is viewing their own profile
  const isOwnProfile = authUser?.id === id;

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const { data, error } = await userService.getUserById(id);
        if (error) {
          console.error('Error fetching user:', error);
          setError('Failed to load user data');
        } else if (data) {
          setUser(data);
          // Initialize form with user data, safely
          setFormData({
            name: data.name || '',
            email: data.email || '',
            avatar: data.avatar,
            role: data.role || '',
            department: data.department || '',
            team: data.team || '',
            location: data.location || '',
            phone: data.phone || '',
            bio: data.bio || '',
            skills: data.skills || [],
            _skillsString: data.skills?.join(', ') || ''
          });
        }
      } catch (err) {
        console.error('Error:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle skills input (comma-separated)
  const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const skillsString = e.target.value;
    // Set raw string to the input value for better UX
    setFormData((prev) => ({
      ...prev,
      // Store the raw comma-separated string temporarily
      _skillsString: skillsString,
      // Also parse it to an array for saving
      skills: skillsString
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill)
    }));
  };

  // Format skills for the input field - use the raw string if available, otherwise join the array
  const skillsString = formData._skillsString !== undefined 
    ? formData._skillsString 
    : (formData.skills?.join(', ') || '');

  // Save profile changes
  const saveProfile = async () => {
    if (!isOwnProfile || !formData) return;
    
    setIsSaving(true);
    try {
      // Only include fields that can be updated (excluding temporary fields)
      const updateData: Partial<UserType> = {
        name: formData.name,
        department: formData.department,
        team: formData.team,
        role: formData.role,
        location: formData.location,
        phone: formData.phone,
        avatar: formData.avatar,
        bio: formData.bio,
        skills: formData.skills,
      };
      
      const { error } = await userService.updateUserProfile(id, updateData);
      
      if (error) {
        throw error;
      }
      
      // Update the UI with new data
      setUser({...user!, ...updateData});
      setEditMode(false);
      toast({
        title: "Success",
        description: "Your profile has been updated",
      });
    } catch (err) {
      console.error('Error updating profile:', err);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel edit mode and reset form
  const cancelEdit = () => {
    if (user) {
      setFormData({
        ...user,
        _skillsString: user.skills?.join(', ') || ''
      });
    }
    setEditMode(false);
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not available';
    
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date);
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Format last active date
  const getLastActive = (lastActiveDate?: string): string => {
    if (!lastActiveDate) return "Unknown";

    const lastActive = new Date(lastActiveDate);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return formatDate(lastActiveDate);
  };

  if (loading) {
    return (
      <>
        <Header title="Loading Profile..." />
        <div className="p-4 lg:p-6">
          <div className="flex justify-center items-center h-64">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-blue border-t-transparent"></div>
          </div>
        </div>
      </>
    );
  }

  if (error || !user) {
    return notFound();
  }

  return (
    <>
      <Header title={`${isOwnProfile ? 'My' : `${user.name}'s`} Profile`} />
      <div className="p-4 lg:p-6 space-y-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Button 
              variant="outline" 
              size="sm" 
              className="mr-2"
              onClick={() => window.history.back()}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">{isOwnProfile ? 'My Profile' : 'User Profile'}</h1>
          </div>
          
          {isOwnProfile && !editMode && (
            <Button 
              onClick={() => setEditMode(true)}
              variant="outline"
              size="sm"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
          
          {isOwnProfile && editMode && (
            <div className="flex gap-2">
              <Button 
                onClick={cancelEdit}
                variant="outline"
                size="sm"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              
              <Button 
                onClick={saveProfile}
                variant="default"
                size="sm"
                className="bg-primary-blue hover:bg-primary-blue/90"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="md:col-span-1">
            <CardContent className="p-6">
              <div className="flex flex-col items-center space-y-4">
                {editMode ? (
                  <div className="space-y-4 text-center">
                    <Avatar className="h-32 w-32 mx-auto">
                      <AvatarImage src={formData.avatar || "/placeholder.svg"} alt={formData.name} />
                      <AvatarFallback className="text-4xl">
                        {formData.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                        }
                      </AvatarFallback>
                    </Avatar>
                    <ProfilePhotoUploadDialog
                      userId={id}
                      onUploaded={(url) => {
                        setFormData(prev => ({ ...prev, avatar: url }));
                        setUser(prev => prev ? { ...prev, avatar: url } : null);
                      }}
                    />
                  </div>
                ) : (
                  <Avatar className="h-32 w-32">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                    <AvatarFallback className="text-4xl">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                      }
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className="text-center space-y-1">
                  {editMode ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input 
                          id="name" 
                          name="name" 
                          value={formData.name || ''} 
                          onChange={handleInputChange}
                          placeholder="Your full name"
                          className="text-center"
                        />
                      </div>
                      <div className="space-y-2 mt-2">
                        <Label htmlFor="role">Role</Label>
                        <Input 
                          id="role" 
                          name="role" 
                          value={formData.role || ''} 
                          onChange={handleInputChange}
                          placeholder="Your job title"
                          className="text-center"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <h2 className="text-2xl font-bold">{user.name}</h2>
                      <p className="text-muted-foreground">{user.role}</p>
                      <Badge className="mt-2">{user.department}</Badge>
                    </>
                  )}
                </div>
                
                {!editMode && (
                  <div className="w-full pt-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Last active:</span>
                      <span>{getLastActive(user.last_active)}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Details */}
          <div className="md:col-span-2">
            <Tabs defaultValue="info">
              <TabsList className="w-full grid grid-cols-2 mb-6">
                <TabsTrigger value="info">
                  <User className="h-4 w-4 mr-2" />
                  Information
                </TabsTrigger>
                <TabsTrigger value="skills">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Skills & Experience
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {editMode ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input 
                            id="email" 
                            value={user.email} 
                            disabled
                            className="bg-muted"
                          />
                          <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <Input 
                            id="phone" 
                            name="phone" 
                            value={formData.phone || ''} 
                            onChange={handleInputChange}
                            placeholder="Your phone number"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="location">Location</Label>
                          <Input 
                            id="location" 
                            name="location" 
                            value={formData.location || ''} 
                            onChange={handleInputChange}
                            placeholder="Your location"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="joined_date">Joined</Label>
                          <Input 
                            id="joined_date" 
                            value={formatDate(user.joined_date)}
                            disabled
                            className="bg-muted"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Email</p>
                            <p className="text-sm font-medium">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Phone</p>
                            <p className="text-sm font-medium">{user.phone || 'Not provided'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Location</p>
                            <p className="text-sm font-medium">{user.location || 'Not provided'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Joined</p>
                            <p className="text-sm font-medium">{formatDate(user.joined_date)}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Organizational Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {editMode ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="department">Department</Label>
                          <Input 
                            id="department" 
                            name="department" 
                            value={formData.department || ''} 
                            onChange={handleInputChange}
                            placeholder="Your department"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="team">Team</Label>
                          <Input 
                            id="team" 
                            name="team" 
                            value={formData.team || ''} 
                            onChange={handleInputChange}
                            placeholder="Your team"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Department</p>
                            <p className="text-sm font-medium">{user.department || 'Not assigned'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Team</p>
                            <p className="text-sm font-medium">{user.team || 'Not assigned'}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {editMode ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Bio</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Label htmlFor="bio">About you</Label>
                        <Textarea 
                          id="bio" 
                          name="bio" 
                          value={formData.bio || ''} 
                          onChange={handleInputChange}
                          placeholder="Write a short bio about yourself"
                          className="min-h-[100px]"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ) : user.bio ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Bio</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{user.bio}</p>
                    </CardContent>
                  </Card>
                ) : null}
              </TabsContent>

              <TabsContent value="skills" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Skills</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {editMode ? (
                      <div className="space-y-2">
                        <Label htmlFor="skills">Skills (comma-separated)</Label>
                        <Input 
                          id="skills" 
                          name="skills" 
                          value={skillsString} 
                          onChange={handleSkillsChange}
                          placeholder="e.g. JavaScript, React, UI Design"
                        />
                        <p className="text-xs text-muted-foreground">
                          Enter your skills separated by commas
                        </p>
                      </div>
                    ) : (
                      <>
                        {user.skills && user.skills.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {user.skills.map((skill, index) => (
                              <Badge key={index} variant="outline">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No skills listed</p>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
                
                {/* Additional sections can be added here for projects, activity, etc. */}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
} 