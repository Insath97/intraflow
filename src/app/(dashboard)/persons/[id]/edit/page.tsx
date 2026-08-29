"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { PersonService, TerritoryService, AuditLogService } from "@/services";
import type { Province, District, DSDivision, GNDivision } from "@/types";
import { useAuthStore } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/common/page-header";
import { LoadingState } from "@/components/common/loading-state";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { FormField } from "@/components/forms/form-field";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  User,
  MapPin,
  Heart,
  Users,
  GraduationCap,
  HandHeart,
  ClipboardCheck,
} from "lucide-react";
import { cn, calculateAge } from "@/lib/utils";

interface FormData {
  fullName: string;
  nameWithInitials: string;
  nicNumber: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other" | "";
  maritalStatus: "single" | "married" | "divorced" | "widowed" | "";
  contactNumber: string;
  email: string;
  address: string;

  provinceId: string;
  districtId: string;
  dsDivisionId: string;
  gnDivisionId: string;
  village: string;
  postalCode: string;

  disabilityType: string;
  disabilityCategory: string;
  disabilityLevel: "mild" | "moderate" | "severe" | "profound" | "";
  cause: string;
  dateIdentified: string;
  certificationStatus: "certified" | "pending" | "not_certified" | "";
  disabilityDescription: string;
  assistanceRequired: string[];

  guardianName: string;
  guardianRelationship: string;
  guardianContact: string;
  guardianAddress: string;
  householdSize: number;

  educationLevel: string;
  employmentStatus: string;
  occupation: string;
  employer: string;
  monthlyIncome: number;
  skills: string;

  governmentAssistance: boolean;
  medicalAssistance: boolean;
  educationSupport: boolean;
  employmentSupport: boolean;
  equipmentRequired: string[];
  otherSupport: string;
}

const STEPS = [
  { label: "Personal Info", icon: User },
  { label: "Territory", icon: MapPin },
  { label: "Disability", icon: Heart },
  { label: "Family", icon: Users },
  { label: "Education", icon: GraduationCap },
  { label: "Support", icon: HandHeart },
  { label: "Review", icon: ClipboardCheck },
];

const ASSISTANCE_OPTIONS = [
  "Mobility Aid",
  "Wheelchair",
  "Prosthetic Limb",
  "Hearing Aid",
  "Visual Aid",
  "Communication Device",
  "Personal Care",
  "Transportation",
  "Home Modification",
  "Caregiver Support",
];

const EQUIPMENT_OPTIONS = [
  "Wheelchair",
  "Walking Frame",
  "Crutches",
  "Hearing Aid",
  "Magnifying Glass",
  "Braille Display",
  "Speech Synthesizer",
  "Modified Keyboard",
  "Adaptive Mouse",
  "Reaching Aid",
];

const DISABILITY_TYPES = [
  "Physical",
  "Visual",
  "Hearing",
  "Speech",
  "Intellectual",
  "Psychosocial",
  "Multiple",
];

const DISABILITY_CATEGORIES = [
  "Congenital",
  "Acquired",
  "Degenerative",
  "Traumatic",
  "Chronic Illness",
];

const EDUCATION_LEVELS = [
  "No Formal Education",
  "Primary Education",
  "Junior Secondary",
  "Senior Secondary",
  "Vocational Training",
  "Diploma",
  "Bachelor's Degree",
  "Post Graduate",
];

const EMPLOYMENT_STATUSES = [
  "Employed Full-Time",
  "Employed Part-Time",
  "Self-Employed",
  "Unemployed",
  "Retired",
  "Student",
  "Unable to Work",
];

const MARITAL_STATUSES = ["single", "married", "divorced", "widowed"];

function toFormData(person: any): FormData {
  return {
    fullName: person.fullName || "",
    nameWithInitials: person.nameWithInitials || "",
    nicNumber: person.nicNumber || "",
    dateOfBirth: person.dateOfBirth || "",
    gender: person.gender || "",
    maritalStatus: person.maritalStatus || "",
    contactNumber: person.contactNumber || "",
    email: person.email || "",
    address: person.address || "",

    provinceId: person.provinceId || "",
    districtId: person.districtId || "",
    dsDivisionId: person.dsDivisionId || "",
    gnDivisionId: person.gnDivisionId || "",
    village: person.village || "",
    postalCode: person.postalCode || "",

    disabilityType: person.disabilityType || "",
    disabilityCategory: person.disabilityCategory || "",
    disabilityLevel: person.disabilityLevel || "",
    cause: person.cause || "",
    dateIdentified: person.dateIdentified || "",
    certificationStatus: person.certificationStatus || "",
    disabilityDescription: person.disabilityDescription || "",
    assistanceRequired: person.assistanceRequired || [],

    guardianName: person.guardianName || "",
    guardianRelationship: person.guardianRelationship || "",
    guardianContact: person.guardianContact || "",
    guardianAddress: person.guardianAddress || "",
    householdSize: person.householdSize || 1,

    educationLevel: person.educationLevel || "",
    employmentStatus: person.employmentStatus || "",
    occupation: person.occupation || "",
    employer: person.employer || "",
    monthlyIncome: person.monthlyIncome || 0,
    skills: person.skills || "",

    governmentAssistance: person.governmentAssistance || false,
    medicalAssistance: person.medicalAssistance || false,
    educationSupport: person.educationSupport || false,
    employmentSupport: person.employmentSupport || false,
    equipmentRequired: person.equipmentRequired || [],
    otherSupport: person.otherSupport || "",
  };
}

export default function EditPersonPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const { user } = useAuthStore();

  const [formData, setFormData] = useState<FormData | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [dsDivisions, setDSDivisions] = useState<DSDivision[]>([]);
  const [gnDivisions, setGNDivisions] = useState<GNDivision[]>([]);

  useEffect(() => {
    const person = PersonService.getById(id);
    if (person) {
      setFormData(toFormData(person));
    }
    setProvinces(TerritoryService.getProvinces());
    setLoading(false);
  }, [id]);

  useEffect(() => {
    if (formData?.provinceId) {
      setDistricts(TerritoryService.getDistrictsByProvince(formData.provinceId));
    } else {
      setDistricts([]);
    }
  }, [formData?.provinceId]);

  useEffect(() => {
    if (formData?.districtId) {
      setDSDivisions(TerritoryService.getDSDivisionsByDistrict(formData.districtId));
    } else {
      setDSDivisions([]);
    }
  }, [formData?.districtId]);

  useEffect(() => {
    if (formData?.dsDivisionId) {
      setGNDivisions(TerritoryService.getGNDivisionsByDS(formData.dsDivisionId));
    } else {
      setGNDivisions([]);
    }
  }, [formData?.dsDivisionId]);

  const updateField = useCallback(
    (field: keyof FormData, value: string | number | boolean | string[]) => {
      setFormData((prev) => (prev ? { ...prev, [field]: value } : prev));
      if (errors[field]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    },
    [errors]
  );

  const toggleAssistance = useCallback(
    (option: string) => {
      if (!formData) return;
      const current = formData.assistanceRequired;
      const next = current.includes(option)
        ? current.filter((a) => a !== option)
        : [...current, option];
      updateField("assistanceRequired", next);
    },
    [formData, updateField]
  );

  const toggleEquipment = useCallback(
    (option: string) => {
      if (!formData) return;
      const current = formData.equipmentRequired;
      const next = current.includes(option)
        ? current.filter((e) => e !== option)
        : [...current, option];
      updateField("equipmentRequired", next);
    },
    [formData, updateField]
  );

  const validateStep = useCallback(
    (step: number): boolean => {
      if (!formData) return false;
      const newErrors: Record<string, string> = {};

      if (step === 1) {
        if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
        if (!formData.nicNumber.trim()) newErrors.nicNumber = "NIC number is required";
        if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required";
        if (!formData.gender) newErrors.gender = "Gender is required";
        if (!formData.contactNumber.trim())
          newErrors.contactNumber = "Contact number is required";
      }

      if (step === 2) {
        if (!formData.provinceId) newErrors.provinceId = "Province is required";
        if (!formData.districtId) newErrors.districtId = "District is required";
        if (!formData.dsDivisionId) newErrors.dsDivisionId = "DS Division is required";
        if (!formData.gnDivisionId) newErrors.gnDivisionId = "GN Division is required";
      }

      if (step === 3) {
        if (!formData.disabilityType) newErrors.disabilityType = "Disability type is required";
        if (!formData.disabilityLevel)
          newErrors.disabilityLevel = "Disability level is required";
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [formData]
  );

  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 7));
    }
  }, [currentStep, validateStep]);

  const handleBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!formData || !validateStep(currentStep)) return;

    setSubmitting(true);

    try {
      const age = calculateAge(formData.dateOfBirth);

      const updated = PersonService.update(id, {
        fullName: formData.fullName,
        nameWithInitials: formData.nameWithInitials,
        nicNumber: formData.nicNumber,
        dateOfBirth: formData.dateOfBirth,
        age,
        gender: formData.gender as "male" | "female" | "other",
        maritalStatus: formData.maritalStatus as "single" | "married" | "divorced" | "widowed",
        contactNumber: formData.contactNumber,
        email: formData.email,
        address: formData.address,
        provinceId: formData.provinceId,
        districtId: formData.districtId,
        dsDivisionId: formData.dsDivisionId,
        gnDivisionId: formData.gnDivisionId,
        village: formData.village,
        postalCode: formData.postalCode,
        disabilityType: formData.disabilityType,
        disabilityCategory: formData.disabilityCategory,
        disabilityLevel: formData.disabilityLevel as "mild" | "moderate" | "severe" | "profound",
        cause: formData.cause,
        dateIdentified: formData.dateIdentified,
        certificationStatus: formData.certificationStatus as "certified" | "pending" | "not_certified",
        disabilityDescription: formData.disabilityDescription,
        assistanceRequired: formData.assistanceRequired,
        guardianName: formData.guardianName,
        guardianRelationship: formData.guardianRelationship,
        guardianContact: formData.guardianContact,
        guardianAddress: formData.guardianAddress,
        householdSize: formData.householdSize,
        educationLevel: formData.educationLevel,
        employmentStatus: formData.employmentStatus,
        occupation: formData.occupation,
        employer: formData.employer,
        monthlyIncome: formData.monthlyIncome,
        skills: formData.skills,
        governmentAssistance: formData.governmentAssistance,
        medicalAssistance: formData.medicalAssistance,
        educationSupport: formData.educationSupport,
        employmentSupport: formData.employmentSupport,
        equipmentRequired: formData.equipmentRequired,
        otherSupport: formData.otherSupport,
      });

      if (updated) {
        AuditLogService.log(
          "UPDATE",
          "Persons",
          updated.id,
          `Updated person: ${updated.fullName}`,
          "success",
          `Registration No: ${updated.registrationNo}`,
          user?.id,
          user?.name
        );

        toast("Person updated successfully!", "success");
        router.push(`/persons/${id}`);
      } else {
        toast("Failed to update person. Person not found.", "error");
      }
    } catch {
      toast("Failed to update person. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  }, [formData, currentStep, validateStep, id, toast, router, user]);

  const getProvinceName = (val: string) =>
    provinces.find((p) => p.id === val)?.name || "";
  const getDistrictName = (val: string) =>
    districts.find((d) => d.id === val)?.name || "";
  const getDSName = (val: string) =>
    dsDivisions.find((d) => d.id === val)?.name || "";
  const getGNName = (val: string) =>
    gnDivisions.find((g) => g.id === val)?.name || "";

  if (loading) {
    return <LoadingState fullPage message="Loading person data..." />;
  }

  if (!formData) {
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
          description="The person you are trying to edit does not exist."
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
        title="Edit Person"
        description={`Editing ${formData.fullName}`}
        breadcrumbs={[
          { label: "Dashboard", onClick: () => router.push("/dashboard") },
          { label: "Persons", onClick: () => router.push("/persons") },
          { label: formData.fullName, onClick: () => router.push(`/persons/${id}`) },
          { label: "Edit" },
        ]}
      />

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === index + 1;
              const isCompleted = currentStep > index + 1;

              return (
                <React.Fragment key={step.label}>
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                        isCompleted
                          ? "border-[#FF6B00] bg-[#FF6B00] text-white"
                          : isActive
                            ? "border-[#FF6B00] bg-[#FFF3EB] text-[#FF6B00]"
                            : "border-gray-300 bg-gray-100 text-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-500"
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <StepIcon className="h-5 w-5" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-xs font-medium hidden sm:block",
                        isActive
                          ? "text-[#FF6B00]"
                          : isCompleted
                            ? "text-gray-600 dark:text-gray-300"
                            : "text-gray-400 dark:text-gray-500"
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={cn(
                        "h-0.5 flex-1 mx-2 mt-[-1.5rem] sm:mt-0",
                        isCompleted
                          ? "bg-[#FF6B00]"
                          : "bg-gray-200 dark:bg-gray-700"
                      )}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="min-h-[400px]">
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Personal Information
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Full Name" required error={errors.fullName}>
                  <Input
                    placeholder="Enter full name"
                    value={formData.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                    error={!!errors.fullName}
                  />
                </FormField>
                <FormField label="Name with Initials">
                  <Input
                    placeholder="e.g., A.B.C. Perera"
                    value={formData.nameWithInitials}
                    onChange={(e) => updateField("nameWithInitials", e.target.value)}
                  />
                </FormField>
                <FormField label="NIC Number" required error={errors.nicNumber}>
                  <Input
                    placeholder="Enter NIC number"
                    value={formData.nicNumber}
                    onChange={(e) => updateField("nicNumber", e.target.value)}
                    error={!!errors.nicNumber}
                  />
                </FormField>
                <FormField label="Date of Birth" required error={errors.dateOfBirth}>
                  <Input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => updateField("dateOfBirth", e.target.value)}
                    error={!!errors.dateOfBirth}
                  />
                </FormField>
                <FormField label="Gender" required error={errors.gender}>
                  <Select
                    value={formData.gender}
                    onChange={(e) => updateField("gender", e.target.value)}
                    error={!!errors.gender}
                    placeholder="Select gender"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </Select>
                </FormField>
                <FormField label="Marital Status">
                  <Select
                    value={formData.maritalStatus}
                    onChange={(e) => updateField("maritalStatus", e.target.value)}
                    placeholder="Select marital status"
                  >
                    {MARITAL_STATUSES.map((s) => (
                      <option key={s} value={s} className="capitalize">
                        {s}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="Contact Number" required error={errors.contactNumber}>
                  <Input
                    placeholder="Enter contact number"
                    value={formData.contactNumber}
                    onChange={(e) => updateField("contactNumber", e.target.value)}
                    error={!!errors.contactNumber}
                  />
                </FormField>
                <FormField label="Email">
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                  />
                </FormField>
              </div>
              <FormField label="Address">
                <Textarea
                  placeholder="Enter full address"
                  value={formData.address}
                  onChange={(e) => updateField("address", e.target.value)}
                />
              </FormField>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Territory Information
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Province" required error={errors.provinceId}>
                  <Select
                    value={formData.provinceId}
                    onChange={(e) => updateField("provinceId", e.target.value)}
                    error={!!errors.provinceId}
                    placeholder="Select province"
                  >
                    {provinces.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="District" required error={errors.districtId}>
                  <Select
                    value={formData.districtId}
                    onChange={(e) => updateField("districtId", e.target.value)}
                    error={!!errors.districtId}
                    placeholder="Select district"
                    disabled={!formData.provinceId}
                  >
                    {districts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="DS Division" required error={errors.dsDivisionId}>
                  <Select
                    value={formData.dsDivisionId}
                    onChange={(e) => updateField("dsDivisionId", e.target.value)}
                    error={!!errors.dsDivisionId}
                    placeholder="Select DS division"
                    disabled={!formData.districtId}
                  >
                    {dsDivisions.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="GN Division" required error={errors.gnDivisionId}>
                  <Select
                    value={formData.gnDivisionId}
                    onChange={(e) => updateField("gnDivisionId", e.target.value)}
                    error={!!errors.gnDivisionId}
                    placeholder="Select GN division"
                    disabled={!formData.dsDivisionId}
                  >
                    {gnDivisions.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="Village">
                  <Input
                    placeholder="Enter village name"
                    value={formData.village}
                    onChange={(e) => updateField("village", e.target.value)}
                  />
                </FormField>
                <FormField label="Postal Code">
                  <Input
                    placeholder="Enter postal code"
                    value={formData.postalCode}
                    onChange={(e) => updateField("postalCode", e.target.value)}
                  />
                </FormField>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Disability Information
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Disability Type" required error={errors.disabilityType}>
                  <Select
                    value={formData.disabilityType}
                    onChange={(e) => updateField("disabilityType", e.target.value)}
                    error={!!errors.disabilityType}
                    placeholder="Select disability type"
                  >
                    {DISABILITY_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="Disability Category">
                  <Select
                    value={formData.disabilityCategory}
                    onChange={(e) => updateField("disabilityCategory", e.target.value)}
                    placeholder="Select category"
                  >
                    {DISABILITY_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="Disability Level" required error={errors.disabilityLevel}>
                  <Select
                    value={formData.disabilityLevel}
                    onChange={(e) => updateField("disabilityLevel", e.target.value)}
                    error={!!errors.disabilityLevel}
                    placeholder="Select level"
                  >
                    <option value="mild">Mild</option>
                    <option value="moderate">Moderate</option>
                    <option value="severe">Severe</option>
                    <option value="profound">Profound</option>
                  </Select>
                </FormField>
                <FormField label="Certification Status">
                  <Select
                    value={formData.certificationStatus}
                    onChange={(e) => updateField("certificationStatus", e.target.value)}
                    placeholder="Select status"
                  >
                    <option value="certified">Certified</option>
                    <option value="pending">Pending</option>
                    <option value="not_certified">Not Certified</option>
                  </Select>
                </FormField>
                <FormField label="Date Identified">
                  <Input
                    type="date"
                    value={formData.dateIdentified}
                    onChange={(e) => updateField("dateIdentified", e.target.value)}
                  />
                </FormField>
                <FormField label="Cause">
                  <Input
                    placeholder="Cause of disability"
                    value={formData.cause}
                    onChange={(e) => updateField("cause", e.target.value)}
                  />
                </FormField>
              </div>
              <FormField label="Disability Description">
                <Textarea
                  placeholder="Describe the disability and its impact..."
                  value={formData.disabilityDescription}
                  onChange={(e) => updateField("disabilityDescription", e.target.value)}
                />
              </FormField>
              <FormField label="Assistance Required">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {ASSISTANCE_OPTIONS.map((option) => (
                    <Checkbox
                      key={option}
                      label={option}
                      checked={formData.assistanceRequired.includes(option)}
                      onCheckedChange={() => toggleAssistance(option)}
                    />
                  ))}
                </div>
              </FormField>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Family & Guardian Information
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Guardian Name">
                  <Input
                    placeholder="Enter guardian name"
                    value={formData.guardianName}
                    onChange={(e) => updateField("guardianName", e.target.value)}
                  />
                </FormField>
                <FormField label="Guardian Relationship">
                  <Input
                    placeholder="e.g., Father, Mother, Spouse"
                    value={formData.guardianRelationship}
                    onChange={(e) => updateField("guardianRelationship", e.target.value)}
                  />
                </FormField>
                <FormField label="Guardian Contact">
                  <Input
                    placeholder="Guardian contact number"
                    value={formData.guardianContact}
                    onChange={(e) => updateField("guardianContact", e.target.value)}
                  />
                </FormField>
                <FormField label="Household Size">
                  <Input
                    type="number"
                    min={1}
                    value={formData.householdSize}
                    onChange={(e) =>
                      updateField("householdSize", parseInt(e.target.value) || 1)
                    }
                  />
                </FormField>
              </div>
              <FormField label="Guardian Address">
                <Textarea
                  placeholder="Enter guardian address"
                  value={formData.guardianAddress}
                  onChange={(e) => updateField("guardianAddress", e.target.value)}
                />
              </FormField>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Education & Employment
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Education Level">
                  <Select
                    value={formData.educationLevel}
                    onChange={(e) => updateField("educationLevel", e.target.value)}
                    placeholder="Select education level"
                  >
                    {EDUCATION_LEVELS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="Employment Status">
                  <Select
                    value={formData.employmentStatus}
                    onChange={(e) => updateField("employmentStatus", e.target.value)}
                    placeholder="Select employment status"
                  >
                    {EMPLOYMENT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="Occupation">
                  <Input
                    placeholder="Enter occupation"
                    value={formData.occupation}
                    onChange={(e) => updateField("occupation", e.target.value)}
                  />
                </FormField>
                <FormField label="Employer">
                  <Input
                    placeholder="Enter employer name"
                    value={formData.employer}
                    onChange={(e) => updateField("employer", e.target.value)}
                  />
                </FormField>
                <FormField label="Monthly Income (LKR)">
                  <Input
                    type="number"
                    min={0}
                    value={formData.monthlyIncome}
                    onChange={(e) =>
                      updateField("monthlyIncome", parseFloat(e.target.value) || 0)
                    }
                  />
                </FormField>
              </div>
              <FormField label="Skills">
                <Textarea
                  placeholder="Describe any relevant skills..."
                  value={formData.skills}
                  onChange={(e) => updateField("skills", e.target.value)}
                />
              </FormField>
            </div>
          )}

          {currentStep === 6 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Support Services
              </h3>
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Active Support Programs
                </h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        Government Assistance
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Monthly stipend & benefits
                      </p>
                    </div>
                    <Switch
                      checked={formData.governmentAssistance}
                      onCheckedChange={(checked) =>
                        updateField("governmentAssistance", checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        Medical Assistance
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Healthcare & treatment support
                      </p>
                    </div>
                    <Switch
                      checked={formData.medicalAssistance}
                      onCheckedChange={(checked) =>
                        updateField("medicalAssistance", checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        Education Support
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Educational resources & tutoring
                      </p>
                    </div>
                    <Switch
                      checked={formData.educationSupport}
                      onCheckedChange={(checked) =>
                        updateField("educationSupport", checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        Employment Support
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Job placement & training
                      </p>
                    </div>
                    <Switch
                      checked={formData.employmentSupport}
                      onCheckedChange={(checked) =>
                        updateField("employmentSupport", checked)
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Equipment Required
                </h4>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {EQUIPMENT_OPTIONS.map((option) => (
                    <Checkbox
                      key={option}
                      label={option}
                      checked={formData.equipmentRequired.includes(option)}
                      onCheckedChange={() => toggleEquipment(option)}
                    />
                  ))}
                </div>
              </div>

              <FormField label="Other Support Details">
                <Textarea
                  placeholder="Describe any other support needs..."
                  value={formData.otherSupport}
                  onChange={(e) => updateField("otherSupport", e.target.value)}
                />
              </FormField>
            </div>
          )}

          {currentStep === 7 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Review & Submit
              </h3>

              <div className="space-y-4">
                <ReviewSection title="Personal Information">
                  <ReviewRow label="Full Name" value={formData.fullName} />
                  <ReviewRow label="Name with Initials" value={formData.nameWithInitials} />
                  <ReviewRow label="NIC Number" value={formData.nicNumber} />
                  <ReviewRow label="Date of Birth" value={formData.dateOfBirth} />
                  <ReviewRow label="Gender" value={formData.gender} />
                  <ReviewRow label="Marital Status" value={formData.maritalStatus} />
                  <ReviewRow label="Contact Number" value={formData.contactNumber} />
                  <ReviewRow label="Email" value={formData.email} />
                  <ReviewRow label="Address" value={formData.address} />
                </ReviewSection>

                <ReviewSection title="Territory">
                  <ReviewRow label="Province" value={getProvinceName(formData.provinceId)} />
                  <ReviewRow label="District" value={getDistrictName(formData.districtId)} />
                  <ReviewRow label="DS Division" value={getDSName(formData.dsDivisionId)} />
                  <ReviewRow label="GN Division" value={getGNName(formData.gnDivisionId)} />
                  <ReviewRow label="Village" value={formData.village} />
                  <ReviewRow label="Postal Code" value={formData.postalCode} />
                </ReviewSection>

                <ReviewSection title="Disability Information">
                  <ReviewRow label="Disability Type" value={formData.disabilityType} />
                  <ReviewRow label="Category" value={formData.disabilityCategory} />
                  <ReviewRow label="Level" value={formData.disabilityLevel} />
                  <ReviewRow label="Certification" value={formData.certificationStatus} />
                  <ReviewRow label="Date Identified" value={formData.dateIdentified} />
                  <ReviewRow label="Cause" value={formData.cause} />
                  <ReviewRow label="Description" value={formData.disabilityDescription} />
                  {formData.assistanceRequired.length > 0 && (
                    <div className="sm:col-span-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Assistance Required
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {formData.assistanceRequired.map((a) => (
                          <span
                            key={a}
                            className="rounded-full bg-[#FFF3EB] px-2.5 py-0.5 text-xs font-medium text-[#FF6B00] dark:bg-[#E55A00]/20 dark:text-[#FF9A5C]"
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </ReviewSection>

                <ReviewSection title="Family & Guardian">
                  <ReviewRow label="Guardian Name" value={formData.guardianName} />
                  <ReviewRow label="Relationship" value={formData.guardianRelationship} />
                  <ReviewRow label="Guardian Contact" value={formData.guardianContact} />
                  <ReviewRow
                    label="Household Size"
                    value={String(formData.householdSize)}
                  />
                  <ReviewRow label="Guardian Address" value={formData.guardianAddress} />
                </ReviewSection>

                <ReviewSection title="Education & Employment">
                  <ReviewRow label="Education Level" value={formData.educationLevel} />
                  <ReviewRow label="Employment Status" value={formData.employmentStatus} />
                  <ReviewRow label="Occupation" value={formData.occupation} />
                  <ReviewRow label="Employer" value={formData.employer} />
                  <ReviewRow
                    label="Monthly Income"
                    value={
                      formData.monthlyIncome > 0
                        ? `LKR ${formData.monthlyIncome.toLocaleString()}`
                        : ""
                    }
                  />
                  <ReviewRow label="Skills" value={formData.skills} />
                </ReviewSection>

                <ReviewSection title="Support Services">
                  <ReviewRow
                    label="Government Assistance"
                    value={formData.governmentAssistance ? "Yes" : "No"}
                  />
                  <ReviewRow
                    label="Medical Assistance"
                    value={formData.medicalAssistance ? "Yes" : "No"}
                  />
                  <ReviewRow
                    label="Education Support"
                    value={formData.educationSupport ? "Yes" : "No"}
                  />
                  <ReviewRow
                    label="Employment Support"
                    value={formData.employmentSupport ? "Yes" : "No"}
                  />
                  {formData.equipmentRequired.length > 0 && (
                    <div className="sm:col-span-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Equipment Required
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {formData.equipmentRequired.map((e) => (
                          <span
                            key={e}
                            className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          >
                            {e}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <ReviewRow label="Other Support" value={formData.otherSupport} />
                </ReviewSection>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <div className="flex items-center gap-3">
            {currentStep < 7 ? (
              <Button onClick={handleNext}>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? (
                  "Saving..."
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800/50">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h4>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
        {value || <span className="text-gray-400 dark:text-gray-500">—</span>}
      </p>
    </div>
  );
}
