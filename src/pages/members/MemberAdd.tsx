import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useMessageStore } from '../../components/MessageHandler';
import { Card, CardHeader, CardContent } from '../../components/ui2/card';
import { Input } from '../../components/ui2/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui2/select';
import { Button } from '../../components/ui2/button';
import { Textarea } from '../../components/ui2/textarea';
import { ImageInput } from '../../components/ui2/image-input';
import { Label } from '../../components/ui2/label';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  Heart,
  Gift,
  UserPlus,
  Home,
  Briefcase,
  Save,
  ArrowLeft,
  Loader2,
  AlertTriangle
} from 'lucide-react';

type Member = {
  id: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  preferred_name?: string;
  contact_number: string;
  address: string;
  email?: string;
  envelope_number?: string;
  membership_category_id: string;
  status_category_id: string;
  membership_date: string | null;
  birthday: string | null;
  profile_picture_url: string | null;
  tenant_id: string;
  created_by: string;
  updated_by: string;
  gender: 'male' | 'female' | 'other';
  marital_status: 'single' | 'married' | 'widowed' | 'divorced';
  baptism_date?: string;
  spiritual_gifts?: string[];
  ministry_interests?: string[];
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  leadership_position?: string;
  small_groups?: string[];
  ministries?: string[];
  volunteer_roles?: string[];
  attendance_rate?: number;
  last_attendance_date?: string;
  pastoral_notes?: string;
  prayer_requests?: string[];
};

function MemberAdd() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addMessage } = useMessageStore();
  const [error, setError] = useState<string | null>(null);

  // Get current tenant
  const { data: currentTenant } = useQuery({
    queryKey: ['current-tenant'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_current_tenant');
      if (error) throw error;
      return data?.[0];
    },
  });

  // Get membership categories
  const { data: membershipCategories } = useQuery({
    queryKey: ['categories', 'membership'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('type', 'membership')
        .eq('tenant_id', currentTenant?.id)
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('sort_order');

      if (error) throw error;
      return data;
    },
    enabled: !!currentTenant?.id,
  });

  // Get status categories
  const { data: statusCategories } = useQuery({
    queryKey: ['categories', 'member_status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('type', 'member_status')
        .eq('tenant_id', currentTenant?.id)
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('sort_order');

      if (error) throw error;
      return data;
    },
    enabled: !!currentTenant?.id,
  });

  const [formData, setFormData] = useState<Partial<Member>>({
    status_category_id: statusCategories?.[0]?.id,
    membership_category_id: membershipCategories?.[0]?.id,
    membership_date: null,
    birthday: null,
    gender: 'male',
    marital_status: 'single',
    spiritual_gifts: [],
    ministry_interests: [],
    small_groups: [],
    ministries: [],
    volunteer_roles: [],
    prayer_requests: [],
  });

  const addMemberMutation = useMutation({
    mutationFn: async (data: Partial<Member>) => {
      const { data: newMember, error } = await supabase
        .from('members')
        .insert([{
          ...data,
          tenant_id: currentTenant?.id,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return newMember;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      addMessage({
        type: 'success',
        text: 'Member added successfully',
        duration: 3000,
      });
      navigate('/members');
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.first_name || !formData.last_name || !formData.contact_number || !formData.address) {
      setError('Please fill in all required fields');
      return;
    }
   
    // Check if a member with the same first and last name already exists under the current tenant
    const { data: existingMembers, error: memberCheckError } = await supabase
      .from('members')
      .select('id')
      .eq('first_name', formData.first_name)
      .eq('last_name', formData.last_name)
      .eq('tenant_id', currentTenant?.id);

    if (memberCheckError) {
      setError('Error checking for duplicate member: ' + memberCheckError.message);
      return;
    }

    if (existingMembers && existingMembers.length > 0) {
      setError('A member with this first and last name already exists.');
      return;
    }

    try {
      await addMemberMutation.mutateAsync(formData);
    } catch (error) {
      console.error('Error adding member:', error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleArrayInputChange = (name: string, value: string[]) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/members')}
          className="flex items-center"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Members
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-medium">Add New Member</h3>
          <p className="text-sm text-muted-foreground">
            Fill in the member's personal information and membership details.
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Profile Picture */}
            <div>
              <ImageInput
                label="Profile Picture"
                onChange={(file) => {
                  // Handle profile picture upload
                }}
                helperText="Upload a profile picture (optional)"
              />
            </div>

            {/* Basic Information */}
            <div>
              <h4 className="text-lg font-medium mb-4">Basic Information</h4>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={formData.first_name || ''}
                    onChange={handleInputChange}
                    required
                    icon={<User className="h-4 w-4" />}
                  />
                </div>

                <div>
                  <Label htmlFor="middle_name">Middle Name</Label>
                  <Input
                    id="middle_name"
                    name="middle_name"
                    value={formData.middle_name || ''}
                    onChange={handleInputChange}
                    icon={<User className="h-4 w-4" />}
                  />
                </div>

                <div>
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={formData.last_name || ''}
                    onChange={handleInputChange}
                    required
                    icon={<User className="h-4 w-4" />}
                  />
                </div>

                <div>
                  <Label htmlFor="preferred_name">Preferred Name</Label>
                  <Input
                    id="preferred_name"
                    name="preferred_name"
                    value={formData.preferred_name || ''}
                    onChange={handleInputChange}
                    icon={<User className="h-4 w-4" />}
                  />
                </div>

                <div>
                  <Label htmlFor="gender">Gender *</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value as Member['gender'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="marital_status">Marital Status *</Label>
                  <Select
                    value={formData.marital_status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, marital_status: value as Member['marital_status'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select marital status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="married">Married</SelectItem>
                      <SelectItem value="widowed">Widowed</SelectItem>
                      <SelectItem value="divorced">Divorced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="birthday">Date of Birth</Label>
                  <Input
                    type="date"
                    id="birthday"
                    name="birthday"
                    value={formData.birthday || ''}
                    onChange={handleInputChange}
                    icon={<Calendar className="h-4 w-4" />}
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h4 className="text-lg font-medium mb-4">Contact Information</h4>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email || ''}
                    onChange={handleInputChange}
                    icon={<Mail className="h-4 w-4" />}
                  />
                </div>

                <div>
                  <Label htmlFor="contact_number">Contact Number *</Label>
                  <Input
                    id="contact_number"
                    name="contact_number"
                    value={formData.contact_number || ''}
                    onChange={handleInputChange}
                    required
                    icon={<Phone className="h-4 w-4" />}
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="address">Address *</Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={formData.address || ''}
                    onChange={handleInputChange}
                    required
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Church Information */}
            <div>
              <h4 className="text-lg font-medium mb-4">Church Information</h4>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="membership_category_id">Membership Type *</Label>
                  <Select
                    value={formData.membership_category_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, membership_category_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select membership type" />
                    </SelectTrigger>
                    <SelectContent>
                      {membershipCategories?.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status_category_id">Status *</Label>
                  <Select
                    value={formData.status_category_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status_category_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusCategories?.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="membership_date">Membership Date</Label>
                  <Input
                    type="date"
                    id="membership_date"
                    name="membership_date"
                    value={formData.membership_date || ''}
                    onChange={handleInputChange}
                    icon={<Calendar className="h-4 w-4" />}
                  />
                </div>

                <div>
                  <Label htmlFor="baptism_date">Baptism Date</Label>
                  <Input
                    type="date"
                    id="baptism_date"
                    name="baptism_date"
                    value={formData.baptism_date || ''}
                    onChange={handleInputChange}
                    icon={<Calendar className="h-4 w-4" />}
                  />
                </div>

                <div>
                  <Label htmlFor="envelope_number">Envelope Number</Label>
                  <Input
                    id="envelope_number"
                    name="envelope_number"
                    value={formData.envelope_number || ''}
                    onChange={handleInputChange}
                    pattern="[0-9]*"
                    helperText="Unique identifier for member contributions (numbers only)"
                  />
                </div>
              </div>
            </div>

            {/* Family Information */}
            <div>
              <h4 className="text-lg font-medium mb-4">Family Information</h4>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
                  <Input
                    id="emergency_contact_name"
                    name="emergency_contact_name"
                    value={formData.emergency_contact_name || ''}
                    onChange={handleInputChange}
                    icon={<Users className="h-4 w-4" />}
                  />
                </div>

                <div>
                  <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
                  <Input
                    id="emergency_contact_phone"
                    name="emergency_contact_phone"
                    value={formData.emergency_contact_phone || ''}
                    onChange={handleInputChange}
                    icon={<Phone className="h-4 w-4" />}
                  />
                </div>
              </div>
            </div>

            {/* Ministry Information */}
            <div>
              <h4 className="text-lg font-medium mb-4">Ministry Information</h4>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="leadership_position">Leadership Position</Label>
                  <Input
                    id="leadership_position"
                    name="leadership_position"
                    value={formData.leadership_position || ''}
                    onChange={handleInputChange}
                    icon={<Briefcase className="h-4 w-4" />}
                  />
                </div>

                <div>
                  <Label htmlFor="spiritual_gifts">Spiritual Gifts</Label>
                  <Input
                    id="spiritual_gifts"
                    name="spiritual_gifts"
                    value={formData.spiritual_gifts?.join(', ') || ''}
                    onChange={(e) => handleArrayInputChange('spiritual_gifts', e.target.value.split(',').map(s => s.trim()))}
                    icon={<Gift className="h-4 w-4" />}
                    placeholder="e.g., Teaching, Leadership, Service"
                  />
                </div>

                <div>
                  <Label htmlFor="ministry_interests">Ministry Interests</Label>
                  <Input
                    id="ministry_interests"
                    name="ministry_interests"
                    value={formData.ministry_interests?.join(', ') || ''}
                    onChange={(e) => handleArrayInputChange('ministry_interests', e.target.value.split(',').map(s => s.trim()))}
                    icon={<Heart className="h-4 w-4" />}
                    placeholder="e.g., Youth, Worship, Outreach"
                  />
                </div>

                <div>
                  <Label htmlFor="volunteer_roles">Volunteer Roles</Label>
                  <Input
                    id="volunteer_roles"
                    name="volunteer_roles"
                    value={formData.volunteer_roles?.join(', ') || ''}
                    onChange={(e) => handleArrayInputChange('volunteer_roles', e.target.value.split(',').map(s => s.trim()))}
                    icon={<UserPlus className="h-4 w-4" />}
                    placeholder="e.g., Usher, Sunday School Teacher"
                  />
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <h4 className="text-lg font-medium mb-4">Additional Notes</h4>
              <div className="grid grid-cols-1 gap-y-6">
                <div>
                  <Label htmlFor="pastoral_notes">Pastoral Notes</Label>
                  <Textarea
                    id="pastoral_notes"
                    name="pastoral_notes"
                    value={formData.pastoral_notes || ''}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="prayer_requests">Prayer Requests</Label>
                  <Textarea
                    id="prayer_requests"
                    name="prayer_requests"
                    value={formData.prayer_requests?.join('\n') || ''}
                    onChange={(e) => handleArrayInputChange('prayer_requests', e.target.value.split('\n').map(s => s.trim()))}
                    rows={3}
                    placeholder="Enter each prayer request on a new line"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/15 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    {/* Use the lucide AlertTriangle icon */}
                    <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-destructive">{error}</h3>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => navigate('/members')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addMemberMutation.isPending}
              >
                {addMemberMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Add Member
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default MemberAdd;