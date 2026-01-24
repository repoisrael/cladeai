import { useState } from 'react';
import { PageLayout } from '@/components/shared';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminStats, useFlaggedContent } from '@/hooks/api/useAdmin';
import { useLatestTestRuns, useTestRunHistory } from '@/hooks/api/useTestRuns';
import { Users, Music, PlayCircle, Heart, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: flaggedContent } = useFlaggedContent();
  const { data: latestRuns = [] } = useLatestTestRuns();
  const { data: history = [] } = useTestRunHistory(50);

  const metrics = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'text-blue-500',
    },
    {
      title: 'Active (7d)',
      value: stats?.activeUsers || 0,
      icon: Users,
      color: 'text-green-500',
    },
    {
      title: 'Total Tracks',
      value: stats?.totalTracks || 0,
      icon: Music,
      color: 'text-purple-500',
    },
    {
      title: 'Total Plays',
      value: stats?.totalPlays || 0,
      icon: PlayCircle,
      color: 'text-orange-500',
    },
    {
      title: 'Interactions',
      value: stats?.totalInteractions || 0,
      icon: Heart,
      color: 'text-pink-500',
    },
  ];

  return (
    <PageLayout title="Admin Dashboard">
      <div className="space-y-6">
        {/* Flagged Content Alert */}
        {flaggedContent && flaggedContent.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {flaggedContent.length} items flagged for review. Check the Moderation tab.
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="moderation">Moderation</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="testruns">Test Runs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {statsLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <Card key={i}>
                      <CardHeader className="pb-2">
                        <Skeleton className="h-4 w-20" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-8 w-16" />
                      </CardContent>
                    </Card>
                  ))
                : metrics.map((metric) => {
                    const Icon = metric.icon;
                    return (
                      <Card key={metric.title}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-sm font-medium">
                            {metric.title}
                          </CardTitle>
                          <Icon className={`h-4 w-4 ${metric.color}`} />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {metric.value.toLocaleString()}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
            </div>

            {/* Analytics Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
                <CardDescription>
                  Charts and visualizations will be added here
                </CardDescription>
              </CardHeader>
              <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
                Coming soon: Active users, popular tracks, and system metrics charts
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage user accounts, roles, and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  User management panel will be added here
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="moderation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Moderation</CardTitle>
                <CardDescription>
                  Review flagged content and take action
                </CardDescription>
              </CardHeader>
              <CardContent>
                {flaggedContent && flaggedContent.length > 0 ? (
                  <p className="text-muted-foreground">
                    {flaggedContent.length} items awaiting review
                  </p>
                ) : (
                  <p className="text-muted-foreground">No flagged content</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>
                  Configure feature flags, rate limits, and system preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Settings panel will be added here
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="testruns" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Latest Test Runs</CardTitle>
                <CardDescription>Hourly sanity → pentest → performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-3">
                  {['sanity','pentest','performance'].map((suite) => {
                    const run = latestRuns.find(r => r.suite === suite);
                    return (
                      <div key={suite} className="p-4 rounded-lg bg-muted/40 border border-border/60">
                        <div className="text-sm font-semibold capitalize">{suite}</div>
                        <div className="text-xl font-bold mt-1">{run?.status || 'unknown'}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {run?.started_at ? new Date(run.started_at).toLocaleString() : 'No data'}
                        </div>
                        {run?.duration_ms && (
                          <div className="text-xs text-muted-foreground">{Math.round(run.duration_ms/1000)}s</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>History (latest 50)</CardTitle>
                <CardDescription>Status, timings, and artifact links</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-2 pr-3">Suite</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2 pr-3">Started</th>
                      <th className="py-2 pr-3">Duration</th>
                      <th className="py-2 pr-3">Commit</th>
                      <th className="py-2 pr-3">Artifacts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((run) => (
                      <tr key={`${run.run_id || run.id}-${run.suite}`} className="border-t border-border/60">
                        <td className="py-2 pr-3 capitalize">{run.suite}</td>
                        <td className="py-2 pr-3">{run.status}</td>
                        <td className="py-2 pr-3 text-muted-foreground">
                          {run.started_at ? new Date(run.started_at).toLocaleString() : '—'}
                        </td>
                        <td className="py-2 pr-3">{run.duration_ms ? `${Math.round(run.duration_ms/1000)}s` : '—'}</td>
                        <td className="py-2 pr-3 text-xs font-mono truncate max-w-[120px]" title={run.commit_sha || ''}>{run.commit_sha?.slice(0,7) || '—'}</td>
                        <td className="py-2 pr-3">
                          {run.artifacts_url ? (
                            <a href={run.artifacts_url} target="_blank" rel="noreferrer" className="text-primary underline text-xs">View</a>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}
