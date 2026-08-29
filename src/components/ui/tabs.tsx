import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsContextType {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextType>({
  value: "",
  onValueChange: () => {},
});

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

function Tabs({
  defaultValue,
  value: controlledValue,
  onValueChange,
  children,
  className,
  ...props
}: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const value = controlledValue ?? internalValue;
  const handleChange = onValueChange ?? setInternalValue;

  return (
    <TabsContext.Provider value={{ value, onValueChange: handleChange }}>
      <div className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

const TabList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    role="tablist"
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-lg bg-gray-100 p-1 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
      className
    )}
    {...props}
  />
));
TabList.displayName = "TabList";

interface TabProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

const Tab = React.forwardRef<HTMLButtonElement, TabProps>(
  ({ className, value: tabValue, ...props }, ref) => {
    const { value, onValueChange } = React.useContext(TabsContext);
    const isActive = value === tabValue;

    return (
      <button
        ref={ref}
        role="tab"
        aria-selected={isActive}
        type="button"
        onClick={() => onValueChange(tabValue)}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#168B61] focus-visible:ring-offset-2",
          isActive
            ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100"
            : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100",
          className
        )}
        {...props}
      />
    );
  }
);
Tab.displayName = "Tab";

interface TabPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const TabPanel = React.forwardRef<HTMLDivElement, TabPanelProps>(
  ({ className, value: panelValue, ...props }, ref) => {
    const { value } = React.useContext(TabsContext);
    if (value !== panelValue) return null;

    return (
      <div
        ref={ref}
        role="tabpanel"
        tabIndex={0}
        className={cn(
          "mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#168B61] focus-visible:ring-offset-2",
          className
        )}
        {...props}
      />
    );
  }
);
TabPanel.displayName = "TabPanel";

export { Tabs, TabList, Tab, TabPanel };
