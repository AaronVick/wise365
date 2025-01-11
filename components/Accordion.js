// components.Accordion.js
{/* Scrollable Content */}
<ScrollArea className="flex-1">
  {/* Agents Section */}
  <Accordion type="single" collapsible className="w-full">
    <AccordionItem value="agents">
      <AccordionTrigger>Agents</AccordionTrigger>
      <AccordionContent>
        {Object.entries(agents).map(([category, categoryAgents]) => (
          <div key={category} className="mb-4">
            <h4 className="font-bold text-lg mb-2">{category}</h4>
            {categoryAgents.map((agent) => (
              <div key={agent.id} className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">{agent.name}</p>
                  <p className="text-sm text-gray-500">{agent.role}</p>
                </div>
                <Button variant="link" className="text-blue-500">
                  Chat
                </Button>
              </div>
            ))}
          </div>
        ))}
      </AccordionContent>
    </AccordionItem>
  </Accordion>

  {/* Projects Section */}
  <Accordion type="single" collapsible className="w-full">
    <AccordionItem value="projects">
      <AccordionTrigger>Projects</AccordionTrigger>
      <AccordionContent>
        {projects.map((project) => (
          <div key={project.id} className="flex items-center justify-between py-2 border-b">
            <div>
              <p className="font-medium">{project.name}</p>
              <p className="text-sm text-gray-500">{project.description}</p>
            </div>
            <Button variant="link" className="text-blue-500">
              View Details
            </Button>
          </div>
        ))}
      </AccordionContent>
    </AccordionItem>
  </Accordion>

  {/* Goals Section */}
  <Accordion type="single" collapsible className="w-full">
    <AccordionItem value="goals">
      <AccordionTrigger>Goals</AccordionTrigger>
      <AccordionContent>
        {goals.map((goal) => (
          <div key={goal.id} className="flex items-center justify-between py-2 border-b">
            <div>
              <p className="font-medium">{goal.name}</p>
              <p className="text-sm text-gray-500">{goal.status}</p>
            </div>
            <Button variant="link" className="text-blue-500">
              Update Goal
            </Button>
          </div>
        ))}
      </AccordionContent>
    </AccordionItem>
  </Accordion>

  {/* Resources Section */}
  <Accordion type="single" collapsible className="w-full">
    <AccordionItem value="resources">
      <AccordionTrigger>Resources</AccordionTrigger>
      <AccordionContent>
        {resources.map((resource) => (
          <div key={resource.id} className="flex items-center justify-between py-2 border-b">
            <div>
              <p className="font-medium">{resource.templateName}</p>
              <p className="text-sm text-gray-500">{resource.description}</p>
            </div>
            <Button variant="link" className="text-blue-500">
              Access
            </Button>
          </div>
        ))}
      </AccordionContent>
    </AccordionItem>
  </Accordion>
</ScrollArea>;
