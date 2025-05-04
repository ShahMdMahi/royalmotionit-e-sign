import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { FileLock2, Lock, ShieldCheck, History, AlertTriangle, Key, FileWarning, Download, CheckCircle2, ShieldX } from "lucide-react";

interface DocumentSecuritySettings {
  passwordProtection: boolean;
  trackIpAddress: boolean;
  requireAuthentication: boolean;
  auditTrailEnabled: boolean;
  biometricVerification: boolean;
  documentExpiry: {
    enabled: boolean;
    days: number;
  };
  accessRestriction: {
    restrictDownload: boolean;
    restrictPrinting: boolean;
    geoRestriction: {
      enabled: boolean;
      allowedCountries: string[];
    };
  };
  complianceSettings: {
    eIDAS: boolean;
    ESIGN: boolean;
    UETA: boolean;
  };
  [key: string]: unknown;
}

interface DocumentSecurityProps {
  documentId: string;
  settings: DocumentSecuritySettings;
  auditTrail: {
    timestamp: string;
    event: string;
    user: string;
    ipAddress: string;
    userAgent: string;
    location?: string;
  }[];
  onUpdateSecurity: (settings: DocumentSecuritySettings) => Promise<void>;
  onDownloadAuditTrail: () => Promise<void>;
}

export function DocumentSecurity({
  documentId,
  settings,
  auditTrail,
  onUpdateSecurity,
  onDownloadAuditTrail
}: DocumentSecurityProps) {
  const [localSettings, setLocalSettings] = React.useState<DocumentSecuritySettings>(settings);
  const [isSaving, setIsSaving] = React.useState(false);
  
  const handleToggle = (path: string) => {
    setLocalSettings(prev => {
      const newSettings = { ...prev };
      const pathParts = path.split(".");
      
      if (pathParts.length === 1) {
        return {
          ...newSettings,
          [path]: !newSettings[path as keyof DocumentSecuritySettings]
        };
      } else {
        const nestedCopy = JSON.parse(JSON.stringify(newSettings));
        let current: Record<string, unknown> = nestedCopy;
        for (let i = 0; i < pathParts.length - 1; i++) {
          current = current[pathParts[i]] as Record<string, unknown>;
        }
        
        const lastKey = pathParts[pathParts.length - 1];
        current[lastKey] = !current[lastKey];
        return nestedCopy;
      }
    });
  };
  
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateSecurity(localSettings);
    } catch (error) {
      console.error("Failed to update security settings:", error);
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold flex items-center">
          <FileLock2 className="mr-2 h-6 w-6" />
          Document Security and Compliance
        </h2>
      </div>
      
      <Tabs defaultValue="security">
        <TabsList className="grid grid-cols-3 w-[400px]">
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>
        
        {/* Security Settings Tab */}
        <TabsContent value="security" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Document Access Controls</CardTitle>
              <CardDescription>
                Control how users can access and interact with this document
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Password Protection</h3>
                  <p className="text-sm text-muted-foreground">
                    Require a password to open the document for signing
                  </p>
                </div>
                <Switch 
                  checked={localSettings.passwordProtection}
                  onCheckedChange={() => handleToggle("passwordProtection")}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Require Authentication</h3>
                  <p className="text-sm text-muted-foreground">
                    Force users to authenticate before signing
                  </p>
                </div>
                <Switch 
                  checked={localSettings.requireAuthentication}
                  onCheckedChange={() => handleToggle("requireAuthentication")}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Document Expiration</h3>
                  <p className="text-sm text-muted-foreground">
                    Automatically expire document after {localSettings.documentExpiry.days} days
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="number" 
                    min="1" 
                    max="365" 
                    value={localSettings.documentExpiry.days}
                    className="w-16 h-8 rounded border px-2 text-sm"
                    disabled={!localSettings.documentExpiry.enabled}
                    onChange={(e) => setLocalSettings(prev => ({
                      ...prev, 
                      documentExpiry: {
                        ...prev.documentExpiry,
                        days: parseInt(e.target.value) || 1
                      }
                    }))}
                  />
                  <Switch 
                    checked={localSettings.documentExpiry.enabled}
                    onCheckedChange={() => handleToggle("documentExpiry.enabled")}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Document Restrictions</CardTitle>
              <CardDescription>
                Set limitations on how the document can be used
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Restrict Downloading</h3>
                  <p className="text-sm text-muted-foreground">
                    Prevent recipients from downloading the document
                  </p>
                </div>
                <Switch 
                  checked={localSettings.accessRestriction.restrictDownload}
                  onCheckedChange={() => handleToggle("accessRestriction.restrictDownload")}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Restrict Printing</h3>
                  <p className="text-sm text-muted-foreground">
                    Prevent recipients from printing the document
                  </p>
                </div>
                <Switch 
                  checked={localSettings.accessRestriction.restrictPrinting}
                  onCheckedChange={() => handleToggle("accessRestriction.restrictPrinting")}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Geo-restriction</h3>
                  <p className="text-sm text-muted-foreground">
                    Limit document access to specific countries
                  </p>
                </div>
                <Switch 
                  checked={localSettings.accessRestriction.geoRestriction.enabled}
                  onCheckedChange={() => handleToggle("accessRestriction.geoRestriction.enabled")}
                />
              </div>
              
              {localSettings.accessRestriction.geoRestriction.enabled && (
                <div className="pl-6 border-l-2 border-primary/20 mt-2">
                  <p className="text-sm mb-2">Allowed Countries:</p>
                  <div className="flex flex-wrap gap-2">
                    {localSettings.accessRestriction.geoRestriction.allowedCountries.map((country) => (
                      <Badge key={country} variant="outline">{country}</Badge>
                    ))}
                    <Button size="sm" variant="ghost" className="h-6">
                      <span className="sr-only">Add Country</span>
                      <span>+</span>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Enhanced Verification</CardTitle>
              <CardDescription>
                Additional security measures for identity verification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">IP Address Tracking</h3>
                  <p className="text-sm text-muted-foreground">
                    Record IP addresses of all document interactions
                  </p>
                </div>
                <Switch 
                  checked={localSettings.trackIpAddress}
                  onCheckedChange={() => handleToggle("trackIpAddress")}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Biometric Verification</h3>
                  <p className="text-sm text-muted-foreground">
                    Use facial or fingerprint recognition for authentication
                  </p>
                </div>
                <Switch 
                  checked={localSettings.biometricVerification}
                  onCheckedChange={() => handleToggle("biometricVerification")}
                />
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="flex items-center"
            >
              {isSaving ? (
                <>Saving<span className="ml-2 animate-pulse">...</span></>
              ) : (
                <>Save Security Settings</>
              )}
            </Button>
          </div>
        </TabsContent>
        
        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <ShieldCheck className="mr-2 h-5 w-5" /> 
                Compliance Settings
              </CardTitle>
              <CardDescription>
                Configure compliance settings for e-signature regulations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">eIDAS Compliance (EU)</h3>
                  <p className="text-sm text-muted-foreground">
                    Electronic Identification, Authentication and Trust Services regulation
                  </p>
                </div>
                <Switch 
                  checked={localSettings.complianceSettings.eIDAS}
                  onCheckedChange={() => handleToggle("complianceSettings.eIDAS")}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">ESIGN Act Compliance (US)</h3>
                  <p className="text-sm text-muted-foreground">
                    Electronic Signatures in Global and National Commerce Act
                  </p>
                </div>
                <Switch 
                  checked={localSettings.complianceSettings.ESIGN}
                  onCheckedChange={() => handleToggle("complianceSettings.ESIGN")}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">UETA Compliance (US)</h3>
                  <p className="text-sm text-muted-foreground">
                    Uniform Electronic Transactions Act
                  </p>
                </div>
                <Switch 
                  checked={localSettings.complianceSettings.UETA}
                  onCheckedChange={() => handleToggle("complianceSettings.UETA")}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between bg-muted/20">
              <div className="flex items-start space-x-2">
                <div className="mt-0.5">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Enabling compliance features will add required disclosures and additional verification steps to the signing process.
                </p>
              </div>
            </CardFooter>
          </Card>
          
          <div className="flex justify-end">
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              variant="default"
            >
              {isSaving ? "Saving..." : "Save Compliance Settings"}
            </Button>
          </div>
        </TabsContent>
        
        {/* Audit Trail Tab */}
        <TabsContent value="audit" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center">
                  <History className="mr-2 h-5 w-5" /> 
                  Document Audit Trail
                </CardTitle>
                <CardDescription>
                  Complete record of all document interactions
                </CardDescription>
              </div>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={onDownloadAuditTrail}
                className="flex items-center"
              >
                <Download className="mr-1 h-4 w-4" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[400px] overflow-auto pr-2">
                {auditTrail.length > 0 ? (
                  auditTrail.map((entry, index) => (
                    <div 
                      key={index} 
                      className="border rounded-md p-3 text-sm"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium">{entry.event}</p>
                        <Badge variant="outline" className="text-xs">
                          {new Date(entry.timestamp).toLocaleString()}
                        </Badge>
                      </div>
                      <div className="text-muted-foreground space-y-1 text-xs">
                        <div className="flex items-center">
                          <span className="w-20">User:</span>
                          <span>{entry.user}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="w-20">IP Address:</span>
                          <span>{entry.ipAddress}</span>
                        </div>
                        {entry.location && (
                          <div className="flex items-center">
                            <span className="w-20">Location:</span>
                            <span>{entry.location}</span>
                          </div>
                        )}
                        <div className="flex items-center">
                          <span className="w-20">User Agent:</span>
                          <span className="truncate max-w-[300px]">{entry.userAgent}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <FileWarning className="h-10 w-10 mx-auto mb-2" />
                    <p>No audit trail events found</p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between bg-muted/20">
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <Key className="h-3.5 w-3.5" />
                <span>All audit events are cryptographically signed and tamper-proof</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {auditTrail.length} events
              </Badge>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Audit Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Enable Audit Trail</h3>
                  <p className="text-sm text-muted-foreground">
                    Record all actions taken on this document
                  </p>
                </div>
                <Switch 
                  checked={localSettings.auditTrailEnabled}
                  onCheckedChange={() => handleToggle("auditTrailEnabled")}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Lock className="mr-2 h-5 w-5" />
            Security Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {localSettings.passwordProtection ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <ShieldX className="h-5 w-5 text-red-500" />
                )}
                <span>Password Protection</span>
              </div>
              <Badge variant={localSettings.passwordProtection ? "success" : "destructive"}>
                {localSettings.passwordProtection ? "Protected" : "Not Protected"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {localSettings.requireAuthentication ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <ShieldX className="h-5 w-5 text-amber-500" />
                )}
                <span>Authentication Required</span>
              </div>
              <Badge variant={localSettings.requireAuthentication ? "success" : "outline"}>
                {localSettings.requireAuthentication ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {localSettings.auditTrailEnabled ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <ShieldX className="h-5 w-5 text-amber-500" />
                )}
                <span>Audit Trail</span>
              </div>
              <Badge variant={localSettings.auditTrailEnabled ? "success" : "outline"}>
                {localSettings.auditTrailEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {Object.values(localSettings.complianceSettings).some(Boolean) ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <ShieldX className="h-5 w-5 text-red-500" />
                )}
                <span>Compliance Features</span>
              </div>
              <Badge variant={Object.values(localSettings.complianceSettings).some(Boolean) ? "success" : "destructive"}>
                {Object.values(localSettings.complianceSettings).some(Boolean) ? "Configured" : "Not Configured"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}