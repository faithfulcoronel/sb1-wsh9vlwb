import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { Cake, Book } from 'lucide-react';
import { Card } from './ui2/card';

function WelcomeGreeting() {
  // Get current user's member data
  const { data: member } = useQuery({
    queryKey: ['current-user-member'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return null;

      const { data, error } = await supabase
        .from('members')
        .select('id, first_name, last_name, birthday')
        .eq('email', user.email)
        .is('deleted_at', null)
        .single();

      if (error) {
        console.error('Error fetching member data:', error);
        return null;
      }

      return data;
    }
  });

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Check if it's the user's birthday
  const isBirthday = () => {
    if (!member?.birthday) return false;
    const today = new Date();
    const birthday = new Date(member.birthday);
    return today.getMonth() === birthday.getMonth() && 
           today.getDate() === birthday.getDate();
  };

  // Get verse of the day
const { data: verse } = useQuery({
  queryKey: ['verse-of-the-day'],
  queryFn: async () => {
    const response = await fetch('https://beta.ourmanna.com/api/v1/get/?format=json');
    const data = await response.json();
    return {
      text: data.verse.details.text,
      reference: data.verse.details.reference,
    };
  },
  staleTime: 24 * 60 * 60 * 1000, // Cache for 24 hours
});

  if (!member) return null;

  return (
    <div className="mb-8 space-y-4">
      {isBirthday() ? (
        <Card className="bg-gradient-to-r from-primary-100 to-primary-50 dark:from-primary-900/20 dark:to-primary-800/20 shadow-sm">
          <div className="p-6">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-primary-500 flex items-center justify-center">
                <Cake className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Happy Birthday, {member.first_name}! 🎉
                </h1>
                <p className="mt-1 text-gray-600 dark:text-gray-300">
                  May your day be filled with joy and blessings!
                </p>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {getGreeting()}, {member.first_name} {member.last_name}
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-300">
              Welcome back to your church administration dashboard
            </p>
          </div>
        </Card>
      )}

      {/* Verse of the Day */}
      {verse && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 shadow-sm">
          <div className="p-6">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                <Book className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Verse of the Day
                </h2>
                <blockquote className="mt-2">
                  <p className="text-lg font-medium text-gray-900 dark:text-gray-100 italic">
                    "{verse.text}"
                  </p>
                  <footer className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    — {verse.reference}
                  </footer>
                </blockquote>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

export default WelcomeGreeting;