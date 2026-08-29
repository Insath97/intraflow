"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { PersonService, TerritoryService } from "@/services";
import type { Person } from "@/types";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { StatCard } from "@/components/common/stat-card";
import { LoadingState } from "@/components/common/loading-state";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Pencil,
  User,
  MapPin,
  Heart,
  Users,
  GraduationCap,
  HandHeart,
  Calendar,
  Phone,
  Mail,
  Home,
  CreditCard,
  Shield,
  Briefcase,
  Activity,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function PersonDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const found = PersonService.getById(id);
    setPerson(found);
    setLoading(false);
  }, [id]);

  const territoryNames = useMemo(() => {
    if (!person) return { province: "", district: "", ds: "", gn: "" };

    const province = TerritoryService.getProvinceById(person.provinceId);
    const district = TerritoryService.getDistrictById(person.districtId);
    const ds = TerritoryService.getDSDivisionById(person.dsDivisionId);
    const gn = TerritoryService.getGNDivisionById(person.gnDivisionId);

    return {
      province: province?.name || "N/A",
      district: district?.name || "N/A",
      ds: ds?.name || "N/A",
      gn: gn?.name || "N/A",
    };
  }, [person]);

  const activityTimeline = useMemo(() => {
    if (!person) return [];

    return [
      {
        id: "1",
        action: "Person registered",
        date: person.registeredDate,
        icon: User,
        color: "text-[#168B61]",
        bg: "bg-[#EAF7F1] dark:bg-[#0F684A]/20",
      },
      {
        id: "2",
        action: "Profile created in the system",
        date: person.createdAt,
        icon: Shield,
        color: "text-blue-600",
        bg: "bg-blue-50 dark:bg-blue-900/20",
      },
      {
        id: "3",
        action: "Last updated",
        date: person.updatedAt,
        icon: Activity,
        color: "text-amber-600",
        bg: "bg-amber-50 dark:bg-amber-900/20",
      },
    ];
  }, [person]);

  if (loading) {
    return <LoadingState fullPage message="Loading person details..." />;
  }

  if (!person) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Person Not Found"
          breadcrumbs={[
            { label: "Dashboard", onClick: () => router.push("/dashboard") },
            { label: "Persons", onClick: () => router.push("/persons") },
            { label: "Not Found" },
          ]}
        />
        <EmptyState
          title="Person not found"
          description="The person you are looking for does not exist or has been removed."
          action={{
            label: "Back to Persons",
            onClick: () => router.push("/persons"),
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={person.fullName}
        description={`Registration No: ${person.registrationNo}`}
        breadcrumbs={[
          { label: "Dashboard", onClick: () => router.push("/dashboard") },
          { label: "Persons", onClick: () => router.push("/persons") },
          { label: person.fullName },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/persons")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button onClick={() => router.push(`/persons/${id}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<User className="h-5 w-5" />}
          value={person.age}
          label="Age"
        />
        <StatCard
          icon={<Heart className="h-5 w-5" />}
          value={person.disabilityType}
          label="Disability Type"
        />
        <StatCard
          icon={<MapPin className="h-5 w-5" />}
          value={territoryNames.district}
          label="District"
        />
        <StatCard
          icon={<Calendar className="h-5 w-5" />}
          value={formatDate(person.registeredDate)}
          label="Registered Date"
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Person Profile
            </h3>
            <StatusBadge status={person.status} />
          </div>
        </div>

        <div className="p-6">
          <Tabs defaultValue="overview">
            <TabList className="mb-6">
              <Tab value="overview">Overview</Tab>
              <Tab value="personal">Personal Info</Tab>
              <Tab value="disability">Disability</Tab>
              <Tab value="territory">Territory</Tab>
              <Tab value="family">Family</Tab>
              <Tab value="education">Education</Tab>
              <Tab value="support">Support</Tab>
              <Tab value="activity">Activity</Tab>
            </TabList>

            <TabPanel value="overview">
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <InfoCard title="Personal Details">
                    <InfoRow label="Full Name" value={person.fullName} />
                    <InfoRow label="NIC Number" value={person.nicNumber} />
                    <InfoRow
                      label="Date of Birth"
                      value={formatDate(person.dateOfBirth)}
                    />
                    <InfoRow label="Age" value={`${person.age} years`} />
                    <InfoRow label="Gender" value={person.gender} />
                    <InfoRow label="Marital Status" value={person.maritalStatus} />
                  </InfoCard>

                  <InfoCard title="Contact Information">
                    <InfoRow label="Phone" value={person.contactNumber} />
                    <InfoRow label="Email" value={person.email || "N/A"} />
                    <InfoRow label="Address" value={person.address || "N/A"} />
                  </InfoCard>

                  <InfoCard title="Disability Summary">
                    <InfoRow label="Type" value={person.disabilityType} />
                    <InfoRow label="Level" value={person.disabilityLevel} />
                    <InfoRow label="Category" value={person.disabilityCategory || "N/A"} />
                    <InfoRow
                      label="Certification"
                      value={person.certificationStatus}
                    />
                  </InfoCard>

                  <InfoCard title="Territory">
                    <InfoRow label="Province" value={territoryNames.province} />
                    <InfoRow label="District" value={territoryNames.district} />
                    <InfoRow label="DS Division" value={territoryNames.ds} />
                    <InfoRow label="GN Division" value={territoryNames.gn} />
                  </InfoCard>
                </div>
              </div>
            </TabPanel>

            <TabPanel value="personal">
              <div className="space-y-4">
                <InfoCard title="Personal Information">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <InfoRow label="Full Name" value={person.fullName} />
                    <InfoRow label="Name with Initials" value={person.nameWithInitials || "N/A"} />
                    <InfoRow label="NIC Number" value={person.nicNumber} />
                    <InfoRow
                      label="Date of Birth"
                      value={formatDate(person.dateOfBirth)}
                    />
                    <InfoRow label="Age" value={`${person.age} years`} />
                    <InfoRow label="Gender" value={person.gender} />
                    <InfoRow label="Marital Status" value={person.maritalStatus} />
                    <InfoRow label="Contact Number" value={person.contactNumber} />
                    <InfoRow label="Email" value={person.email || "N/A"} />
                    <InfoRow label="Address" value={person.address || "N/A"} />
                  </div>
                </InfoCard>
              </div>
            </TabPanel>

            <TabPanel value="disability">
              <div className="space-y-4">
                <InfoCard title="Disability Information">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <InfoRow label="Disability Type" value={person.disabilityType} />
                    <InfoRow label="Category" value={person.disabilityCategory || "N/A"} />
                    <InfoRow label="Level" value={person.disabilityLevel} />
                    <InfoRow
                      label="Certification Status"
                      value={person.certificationStatus}
                    />
                    <InfoRow
                      label="Date Identified"
                      value={
                        person.dateIdentified
                          ? formatDate(person.dateIdentified)
                          : "N/A"
                      }
                    />
                    <InfoRow label="Cause" value={person.cause || "N/A"} />
                    <div className="sm:col-span-2">
                      <InfoRow
                        label="Description"
                        value={person.disabilityDescription || "N/A"}
                      />
                    </div>
                  </div>
                </InfoCard>

                {person.assistanceRequired.length > 0 && (
                  <InfoCard title="Assistance Required">
                    <div className="flex flex-wrap gap-2">
                      {person.assistanceRequired.map((a) => (
                        <Badge key={a} variant="secondary">
                          {a}
                        </Badge>
                      ))}
                    </div>
                  </InfoCard>
                )}
              </div>
            </TabPanel>

            <TabPanel value="territory">
              <div className="space-y-4">
                <InfoCard title="Territory Information">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <InfoRow label="Province" value={territoryNames.province} />
                    <InfoRow label="District" value={territoryNames.district} />
                    <InfoRow label="DS Division" value={territoryNames.ds} />
                    <InfoRow label="GN Division" value={territoryNames.gn} />
                    <InfoRow label="Village" value={person.village || "N/A"} />
                    <InfoRow label="Postal Code" value={person.postalCode || "N/A"} />
                  </div>
                </InfoCard>
              </div>
            </TabPanel>

            <TabPanel value="family">
              <div className="space-y-4">
                <InfoCard title="Guardian Information">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <InfoRow label="Guardian Name" value={person.guardianName || "N/A"} />
                    <InfoRow
                      label="Relationship"
                      value={person.guardianRelationship || "N/A"}
                    />
                    <InfoRow
                      label="Guardian Contact"
                      value={person.guardianContact || "N/A"}
                    />
                    <InfoRow
                      label="Household Size"
                      value={String(person.householdSize)}
                    />
                    <div className="sm:col-span-2">
                      <InfoRow
                        label="Guardian Address"
                        value={person.guardianAddress || "N/A"}
                      />
                    </div>
                  </div>
                </InfoCard>
              </div>
            </TabPanel>

            <TabPanel value="education">
              <div className="space-y-4">
                <InfoCard title="Education & Employment">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <InfoRow
                      label="Education Level"
                      value={person.educationLevel || "N/A"}
                    />
                    <InfoRow
                      label="Employment Status"
                      value={person.employmentStatus || "N/A"}
                    />
                    <InfoRow label="Occupation" value={person.occupation || "N/A"} />
                    <InfoRow label="Employer" value={person.employer || "N/A"} />
                    <InfoRow
                      label="Monthly Income"
                      value={
                        person.monthlyIncome > 0
                          ? `LKR ${person.monthlyIncome.toLocaleString()}`
                          : "N/A"
                      }
                    />
                    <InfoRow label="Skills" value={person.skills || "N/A"} />
                  </div>
                </InfoCard>
              </div>
            </TabPanel>

            <TabPanel value="support">
              <div className="space-y-4">
                <InfoCard title="Support Services">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <InfoRow
                      label="Government Assistance"
                      value={person.governmentAssistance ? "Yes" : "No"}
                    />
                    <InfoRow
                      label="Medical Assistance"
                      value={person.medicalAssistance ? "Yes" : "No"}
                    />
                    <InfoRow
                      label="Education Support"
                      value={person.educationSupport ? "Yes" : "No"}
                    />
                    <InfoRow
                      label="Employment Support"
                      value={person.employmentSupport ? "Yes" : "No"}
                    />
                  </div>
                </InfoCard>

                {person.equipmentRequired.length > 0 && (
                  <InfoCard title="Equipment Required">
                    <div className="flex flex-wrap gap-2">
                      {person.equipmentRequired.map((e) => (
                        <Badge key={e} variant="info">
                          {e}
                        </Badge>
                      ))}
                    </div>
                  </InfoCard>
                )}

                {person.otherSupport && (
                  <InfoCard title="Other Support Details">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {person.otherSupport}
                    </p>
                  </InfoCard>
                )}
              </div>
            </TabPanel>

            <TabPanel value="activity">
              <div className="space-y-4">
                <InfoCard title="Activity Timeline">
                  <div className="space-y-4">
                    {activityTimeline.map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-full ${item.bg}`}
                            >
                              <Icon className={`h-5 w-5 ${item.color}`} />
                            </div>
                            {index < activityTimeline.length - 1 && (
                              <div className="mt-2 h-8 w-0.5 bg-gray-200 dark:bg-gray-700" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {item.action}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(item.date)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </InfoCard>
              </div>
            </TabPanel>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
        {value || <span className="text-gray-400 dark:text-gray-500">—</span>}
      </p>
    </div>
  );
}
