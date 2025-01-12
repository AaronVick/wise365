// components/ui/tabs.js

import React, { useState } from 'react';

// Tabs component to hold the logic for tabs
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

// Tabs components to be exported separately for better import control
const TabsList = ({ children }) => <div className="tabs-list">{children}</div>;
const TabsTrigger = ({ value, children }) => <>{children}</>;
const TabsContent = ({ value, children }) => <>{children}</>;

// Exporting Tabs and the sub-components
Tabs.List = TabsList;
Tabs.Trigger = TabsTrigger;
Tabs.Content = TabsContent;

export { Tabs };
