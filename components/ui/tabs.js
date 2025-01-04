import React, { useState } from 'react';

// Tabs Component
const Tabs = ({ children, defaultValue }) => {
  const [activeTab, setActiveTab] = useState(defaultValue || children[0].props.value);

  return (
    <div>
      <div className="tabs-list flex">
        {children.map((tab) => (
          <button
            key={tab.props.value}
            className={`tab-button px-4 py-2 ${activeTab === tab.props.value ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setActiveTab(tab.props.value)}
          >
            {tab.props.children}
          </button>
        ))}
      </div>
      <div className="tabs-content mt-4">
        {children.map((tab) =>
          activeTab === tab.props.value ? (
            <div key={tab.props.value} className="tab-content">
              {tab.props.children}
            </div>
          ) : null
        )}
      </div>
    </div>
  );
};

// Directly export the required components
export const TabsList = ({ children }) => <div className="tabs-list">{children}</div>;
export const TabsTrigger = ({ value, children }) => <>{children}</>;
export const TabsContent = ({ value, children }) => <>{children}</>;

export default Tabs;
