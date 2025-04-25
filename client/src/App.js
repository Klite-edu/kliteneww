import React, { useEffect } from "react";
import "./App.css";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import axios from "axios";

// Import Pages
import PanelLogin from "./component/PanelLogin/PanelLogin";
import Landing from "./component/landingPage/Landing";
import Dashboard from "./component/Dashboard/Dashboard";
import Subscription from "./component/Admin/subscription/Subscription";
import Billings from "./component/Admin/billings/Billings";
import SystemAnalytics from "./component/Admin/SystemAnalytics/SystemAnalytics";
import SupportTickets from "./component/Admin/Tickets/SupportTicket";
import Security from "./component/Admin/Security/Security";
import Performance from "./component/Admin/Performance/Performance";
import Client from "./component/clients/list/Client";
import User from "./component/User/list/User";
import Clientedit from "./component/clients/edit/Clientedit";
import ClientCreate from "./component/clients/create/ClientCreate";
import UserCreate from "./component/User/create/UserCreate";
import UserEdit from "./component/User/edit/UserEdit";
import Permisssions from "./component/Admin/permissions/Permissions";
import Settings from "./component/Admin/settings/Settings";
import Contacts from "./component/clients/CRMold/ContactsManagement/Contacts/list/Contact";
import CreateContact from "./component/clients/CRMold/ContactsManagement/Contacts/create/CreateContact";
// import Leads from "./component/clients/CRM/leads/list/Leads";
import View from "./component/clients/CRMold/ContactsManagement/Contacts/contactDescription/View";
import EditContact from "./component/clients/CRMold/ContactsManagement/Contacts/edit/EditContact";
import Attendance from "./component/clients/attendence/attendence/Attendence";
import AddTask from "./component/clients/checklist/tasks/AddTask";
import TaskList from "./component/clients/checklist/tasks/TaskList";
import DelegateTask from "./component/clients/taskDelegation/DelegateTask/DelegateTask";
import DelegationList from "./component/clients/taskDelegation/TaskDelegationList/DelegationList";
// import Pipeline from "./component/clients/CRM/Pipeline/Pipeline";
import Form from "./component/landingPage/Form/Form";
import TriggerBuilder from "./component/clients/Automations/Triggers/TriggerBuilder";
import FormBuilder from "./component/clients/FormBuilder/FormBuilder";
// import StageLeads from "./component/clients/CRM/Pipeline/StageLeads";
import CRMDashboard from "./component/clients/CRM/CRMDarshboard/CRMDashboard";
import ChatbotForm from "./component/clients/Chatbot/ChatbotForm";
import MetaSignup from "./component/clients/Metasignup/MetaSignup";
import MetaClient from "./component/clients/Metasignup/MetaClient";
import MetaMessage from "./component/clients/Metasignup/MetaMessage";
import MetaTemplate from "./component/clients/Metasignup/MetaTemplate";
import ChatRoomUI from "./component/clients/Chats/ChatRoomUI";
import Sites from "./component/clients/HRM/Sites/Sites";
import TicketRaise from "./component/clients/TicketRaise/TicketRaise";
import PipelinesDashboard from "./component/clients/Pipelines/PipelinesDashboard";
import Profile from "./component/clients/Profile/Profile";
import IndiaMart from "./component/clients/AppStore/IndiaMart/IndiaMart";
import CheckListMIS from "./component/clients/checklist/tasks/MIS/CheckListMIS";
import DelegationMis from "./component/clients/taskDelegation/DelegationMIS/DelegationMIS";
import BotTrigger from "./component/clients/Automations/Triggers/ChatbotLeadTrigger/BotTrigger";
import Variables from "./component/clients/Variables/Variables";
import SeleniumWeb from "./component/clients/Chatbot/SeleniumWeb";
import IssueDashboard from "./component/clients/Issue/IssueDashboard";
import ScrollToTop from "./component/ScrollToTop";
import Microsoft from "./component/clients/AppStore/IndiaMart/Microsoft/Microsoft";
import WorkingDay from "./component/clients/WorkingDays/WorkingDay";

const TrackImpressions = () => {
  useEffect(() => {
    axios
      .post(`${process.env.REACT_APP_API_URL}/api/trackimpression`)
      .then((response) => console.log("Impression Tracked:", response.data))
      .catch((error) => console.error("Error tracking impression:", error));
  }, []);

  return null; // Runs in the background
};

const App = () => {
  const location = useLocation(); // Get the current route

  return (
    <div className="app">
      <TrackImpressions />
      <ScrollToTop />
      <Routes>
        {/* ✅ Public Routes (Accessible Without Login) */}
        <Route path="/" element={<PanelLogin />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/form" element={<Form />} />

        {/* ✅ All Routes Accessible Without Authentication */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/subscriptions" element={<Subscription />} />
        <Route path="/billings" element={<Billings />} />
        <Route path="/systemanalytics" element={<SystemAnalytics />} />
        <Route path="/supporttickets" element={<SupportTickets />} />
        <Route path="/security" element={<Security />} />
        <Route path="/performance" element={<Performance />} />
        <Route path="/clients" element={<Client />} />
        <Route path="/users" element={<User />} />
        <Route path="/clients/edit/:id" element={<Clientedit />} />
        <Route path="/clients/create" element={<ClientCreate />} />
        <Route path="/users/create" element={<UserCreate />} />
        <Route path="/users/edit/:id" element={<UserEdit />} />
        <Route path="/permissions" element={<Permisssions />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/employee" element={<Contacts />} />
        {/* <Route path="/crm/leads" element={<Leads />} /> */}
        <Route path="/employee-create" element={<CreateContact />} />
        <Route path="/edit/:id" element={<EditContact />} />
        <Route path="/chatbox" element={<ChatRoomUI />} />
        <Route path="/view/:id" element={<View />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/check-addtask" element={<AddTask />} />
        <Route path="/check-tasklist" element={<TaskList />} />
        <Route path="/delegation-taskadd" element={<DelegateTask />} />
        <Route path="/delegation-tasklist" element={<DelegationList />} />
        <Route path="/pipeline" element={<PipelinesDashboard />} />
        <Route path="/automation" element={<TriggerBuilder />} />
        <Route path="/FormBuilder" element={<FormBuilder />} />
        {/* <Route path="/pipeline" element={<StageLeads />} /> */}
        <Route path="/opportunities" element={<CRMDashboard />} />
        <Route path="/chatbotform" element={<ChatbotForm />} />
        <Route path="/metasignup" element={<MetaSignup />} />
        <Route path="/metaclient" element={<MetaClient />} />
        <Route path="/metamessage" element={<MetaMessage />} />
        <Route path="/metatemplate" element={<MetaTemplate />} />
        <Route path="/sites" element={<Sites />} />
        <Route path="/ticketraise" element={<TicketRaise />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/appstore" element={<IndiaMart />} />
        <Route path="/check-mis" element={<CheckListMIS />} />
        <Route path="/delegation-mis" element={<DelegationMis />} />
        <Route path="/bot-trigger" element={<BotTrigger />} />
        <Route path="/variables" element={<Variables />} />
        <Route path="/seleniumweb" element={<SeleniumWeb />} />
        <Route path="/issue" element={<IssueDashboard />} />
        <Route path="/microsoft" element={<Microsoft />} />
        <Route path="/workingday" element={<WorkingDay />} />
      </Routes>
    </div>
  );
};

export default App;
