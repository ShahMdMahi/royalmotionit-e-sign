import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line
} from "recharts";
import { 
  AlertTriangle, Check, Clock, File, FileCheck, FilePenLine, FileQuestion, 
  FileText, Info, Loader2, Mail, Users, View, XCircle
} from "lucide-react";

// Color constants
const COLORS = ["#3b82f6", "#10b981", "#6366f1", "#ef4444", "#f97316", "#8b5cf6"];
const STATUS_COLORS = {
  draft: "bg-gray-500/20 text-gray-500 hover:bg-gray-500/30",
  sent: "bg-blue-500/20 text-blue-500 hover:bg-blue-500/30",
  viewed: "bg-purple-500/20 text-purple-500 hover:bg-purple-500/30",
  completed: "bg-green-500/20 text-green-500 hover:bg-green-500/30",
  declined: "bg-red-500/20 text-red-500 hover:bg-red-500/30",
  expired: "bg-orange-500/20 text-orange-500 hover:bg-orange-500/30",
};

interface DocumentAnalyticsProps {
  documents: {
    id: string;
    title: string;
    status: "draft" | "sent" | "viewed" | "completed" | "declined" | "expired";
    createdAt: Date;
    updatedAt: Date;
    signers: {
      id: string;
      name: string;
      email: string;
      status: "pending" | "viewed" | "completed" | "declined";
      lastUpdated?: Date;
      viewCount?: number;
    }[];
  }[];
  timeRange: "7d" | "30d" | "90d" | "1y" | "all";
  onTimeRangeChange: (range: "7d" | "30d" | "90d" | "1y" | "all") => void;
}

export function DocumentAnalytics({ 
  documents, 
  timeRange,
  onTimeRangeChange
}: DocumentAnalyticsProps) {
  // Calculate document statistics
  const totalDocuments = documents.length;
  const completedDocuments = documents.filter(doc => doc.status === "completed").length;
  const pendingDocuments = documents.filter(doc => ["sent", "viewed"].includes(doc.status)).length;
  const declinedDocuments = documents.filter(doc => doc.status === "declined").length;
  const expiredDocuments = documents.filter(doc => doc.status === "expired").length;
  const draftDocuments = documents.filter(doc => doc.status === "draft").length;
  
  const completionRate = totalDocuments > 0 
    ? Math.round((completedDocuments / totalDocuments) * 100) 
    : 0;
    
  // Calculate average time to complete (in hours)
  const completedDocs = documents.filter(doc => doc.status === "completed");
  let avgCompletionTime = 0;
  
  if (completedDocs.length > 0) {
    const totalCompletionTime = completedDocs.reduce((total, doc) => {
      const creationTime = new Date(doc.createdAt).getTime();
      const completionTime = new Date(doc.updatedAt).getTime();
      return total + (completionTime - creationTime);
    }, 0);
    
    avgCompletionTime = Math.round(totalCompletionTime / (completedDocs.length * 1000 * 60 * 60));
  }
  
  // Calculate document status distribution for charts
  const statusDistribution = [
    { name: "Completed", value: completedDocuments },
    { name: "Pending", value: pendingDocuments },
    { name: "Declined", value: declinedDocuments },
    { name: "Expired", value: expiredDocuments },
    { name: "Draft", value: draftDocuments }
  ].filter(status => status.value > 0);
  
  // Create activity data (mock data - would come from your backend in real app)
  const activityData = [
    { date: "Day 1", documents: 5, views: 12, completions: 2 },
    { date: "Day 2", documents: 3, views: 8, completions: 1 },
    { date: "Day 3", documents: 7, views: 15, completions: 4 },
    { date: "Day 4", documents: 4, views: 10, completions: 3 },
    { date: "Day 5", documents: 6, views: 14, completions: 5 },
    { date: "Day 6", documents: 8, views: 20, completions: 6 },
    { date: "Day 7", documents: 10, views: 25, completions: 8 }
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Document Analytics</h2>
        
        <div className="flex items-center space-x-2">
          <TabsList>
            <TabsTrigger 
              value="7d" 
              className={timeRange === "7d" ? "bg-primary text-primary-foreground" : ""}
              onClick={() => onTimeRangeChange("7d")}
            >
              7D
            </TabsTrigger>
            <TabsTrigger 
              value="30d" 
              className={timeRange === "30d" ? "bg-primary text-primary-foreground" : ""}
              onClick={() => onTimeRangeChange("30d")}
            >
              30D
            </TabsTrigger>
            <TabsTrigger 
              value="90d" 
              className={timeRange === "90d" ? "bg-primary text-primary-foreground" : ""}
              onClick={() => onTimeRangeChange("90d")}
            >
              90D
            </TabsTrigger>
            <TabsTrigger 
              value="1y" 
              className={timeRange === "1y" ? "bg-primary text-primary-foreground" : ""}
              onClick={() => onTimeRangeChange("1y")}
            >
              1Y
            </TabsTrigger>
            <TabsTrigger 
              value="all" 
              className={timeRange === "all" ? "bg-primary text-primary-foreground" : ""}
              onClick={() => onTimeRangeChange("all")}
            >
              All
            </TabsTrigger>
          </TabsList>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{totalDocuments}</div>
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {completedDocuments} completed • {pendingDocuments} pending
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{completionRate}%</div>
              <FileCheck className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="mt-2">
              <Progress value={completionRate} className="h-1" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Completion Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {avgCompletionTime > 0 ? `${avgCompletionTime}h` : "N/A"}
              </div>
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {completedDocs.length} completed documents
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Document Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {declinedDocuments + expiredDocuments}
              </div>
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {declinedDocuments} declined • {expiredDocuments} expired
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Status Distribution */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Document Status</CardTitle>
            <CardDescription>
              Distribution of document statuses
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2">
            <div className="h-[300px] flex items-center justify-center">
              {statusDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted-foreground">
                  <FileQuestion className="h-10 w-10 mx-auto mb-2" />
                  <p>No document data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Document Activity */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Document Activity</CardTitle>
            <CardDescription>
              Document activity over time
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={activityData}
                  margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="documents"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    activeDot={{ r: 8 }}
                    name="Documents"
                  />
                  <Line
                    type="monotone"
                    dataKey="views"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    name="Views"
                  />
                  <Line
                    type="monotone"
                    dataKey="completions"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Completions"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Document Status Legend */}
      <div className="flex flex-wrap gap-2 items-center mt-6">
        <span className="text-sm font-medium mr-2">Legend:</span>
        <Badge className={STATUS_COLORS.draft}>
          <File className="h-3 w-3 mr-1" /> Draft
        </Badge>
        <Badge className={STATUS_COLORS.sent}>
          <Mail className="h-3 w-3 mr-1" /> Sent
        </Badge>
        <Badge className={STATUS_COLORS.viewed}>
          <View className="h-3 w-3 mr-1" /> Viewed
        </Badge>
        <Badge className={STATUS_COLORS.completed}>
          <Check className="h-3 w-3 mr-1" /> Completed
        </Badge>
        <Badge className={STATUS_COLORS.declined}>
          <XCircle className="h-3 w-3 mr-1" /> Declined
        </Badge>
        <Badge className={STATUS_COLORS.expired}>
          <AlertTriangle className="h-3 w-3 mr-1" /> Expired
        </Badge>
      </div>
      
      {/* Recent Activity */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FilePenLine className="h-5 w-5" />
            Recent Document Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {documents.length > 0 ? (
              documents
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                .slice(0, 5)
                .map((doc) => (
                  <div key={doc.id} className="flex items-start space-x-4">
                    <div className="p-2 rounded-full bg-muted">
                      {doc.status === "completed" ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : doc.status === "declined" ? (
                        <XCircle className="h-4 w-4 text-red-500" />
                      ) : doc.status === "viewed" ? (
                        <View className="h-4 w-4 text-purple-500" />
                      ) : doc.status === "expired" ? (
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                      ) : doc.status === "sent" ? (
                        <Mail className="h-4 w-4 text-blue-500" />
                      ) : (
                        <File className="h-4 w-4 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{doc.title}</p>
                        <Badge 
                          className={
                            doc.status === "completed" ? STATUS_COLORS.completed :
                            doc.status === "declined" ? STATUS_COLORS.declined :
                            doc.status === "viewed" ? STATUS_COLORS.viewed :
                            doc.status === "expired" ? STATUS_COLORS.expired :
                            doc.status === "sent" ? STATUS_COLORS.sent :
                            STATUS_COLORS.draft
                          }
                          variant="secondary"
                        >
                          {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                          {doc.signers.length} {doc.signers.length === 1 ? "signer" : "signers"}
                        </p>
                        <span className="text-xs text-muted-foreground">•</span>
                        <p className="text-xs text-muted-foreground">
                          Updated {new Date(doc.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex -space-x-2">
                          {doc.signers.slice(0, 3).map((signer) => (
                            <div 
                              key={signer.id}
                              className={`h-6 w-6 rounded-full border-2 border-background flex items-center justify-center text-[10px] font-medium ${
                                signer.status === "completed" ? "bg-green-100 text-green-700" :
                                signer.status === "viewed" ? "bg-purple-100 text-purple-700" :
                                signer.status === "declined" ? "bg-red-100 text-red-700" :
                                "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {signer.name.charAt(0).toUpperCase()}
                            </div>
                          ))}
                          {doc.signers.length > 3 && (
                            <div className="h-6 w-6 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-medium">
                              +{doc.signers.length - 3}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full"
                            style={{ 
                              width: `${Math.round(
                                (doc.signers.filter(s => s.status === "completed").length / doc.signers.length) * 100
                              )}%` 
                            }}
                          ></div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {doc.signers.filter(s => s.status === "completed").length}/{doc.signers.length}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-center p-6 text-muted-foreground">
                <Loader2 className="h-10 w-10 mx-auto mb-2 animate-spin" />
                <p>No recent document activity</p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
          <p className="text-xs flex items-center gap-1 text-muted-foreground">
            <Info className="h-3 w-3" />
            Showing most recent document activity
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}