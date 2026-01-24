import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import companyService from '../services/companyService';

export interface Employee {
  id: number;
  empIdNo: string;
  name: string;
  dateOfJoining: string;
  department: string;
  designation: string;
  gender: string;
  location?: string;
  fixedStipend: number;
  fatherName: string;
  permanentAddress: string;
  communicationAddress: string;
  contactNumber: string;
  emergencyContactNumber: string;
  qualification: string;
  qualificationTrade: string;
  bloodGroup: string;
  adharNumber: string;
  panNumber: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branch: string;
  photo: string;
  experience: string;
  company: string;
  uan: string;
  esiNumber: string;
  insuranceNumber: string;
  category: string;
  status: string;
  // Payment related fields
  presentDays: number;
  totalFixedDays?: number;
  holidays?: number;
  otHours: number;
  totalDeductions?: number;
  finalNetpay?: number;
  salaryType?: string;
  employeeCategory?: string;
  customFields?: Record<string, string>;
}

export interface EmployeeFormValues {
  name: string;
  department: string;
  designation: string;
  location: string;
  baseSalary: number;
}

export interface Company {
  _id: string;  // MongoDB ID
  id: string;   // Keep for backward compatibility
  name: string;
  employees: Employee[];
}

export interface CompanyContextType {
  companies: Company[];
  selectedCompany: Company | null;
  setSelectedCompany: (company: Company | null) => void;
  addCompany: (company: Partial<Company>) => Promise<void>;
  updateCompany: (id: string, company: Partial<Company>) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;
  addEmployee: (employee: Omit<Employee, 'id'>) => Promise<void>;
  importEmployees: (employees: Omit<Employee, 'id'>[]) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch companies and restore selected company
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const data = await companyService.getAllCompanies();
        setCompanies(data);

        const savedCompanyId = localStorage.getItem('selectedCompanyId');
        if (savedCompanyId) {
          const savedCompany = data.find(c => c._id === savedCompanyId);
          if (savedCompany) {
            setSelectedCompany(savedCompany);
          }
        } else if (data.length > 0) {
          // If no saved company but we have companies, select the first one
          setSelectedCompany(data[0]);
          localStorage.setItem('selectedCompanyId', data[0]._id);
        }

        setError(null);
      } catch (err) {
        console.error('Error fetching companies:', err);
        setError('Failed to fetch companies');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  // Custom setSelectedCompany handler to ensure localStorage is always updated
  const handleSetSelectedCompany = (company: Company | null) => {
    setSelectedCompany(company);
    if (company) {
      localStorage.setItem('selectedCompanyId', company._id);
    } else {
      localStorage.removeItem('selectedCompanyId');
    }
  };

  const addCompany = async (companyData: Partial<Company>) => {
    try {
      const newCompany = await companyService.createCompany(
        companyData as Omit<Company, 'id'>
      );
      setCompanies((prev) => [...prev, newCompany]);
      if (!selectedCompany) {
        setSelectedCompany(newCompany);
      }
    } catch (err) {
      console.error('Error adding company:', err);
      throw err;
    }
  };

  const updateCompany = async (id: string, companyData: Partial<Company>) => {
    try {
      const updated = await companyService.updateCompany(id, companyData);
      setCompanies((prev) => prev.map((c) => (c.id === id ? updated : c)));
      if (selectedCompany?.id === id) {
        setSelectedCompany(updated);
      }
    } catch (err) {
      console.error('Error updating company:', err);
      throw err;
    }
  };

  const deleteCompany = async (id: string) => {
    try {
      await companyService.deleteCompany(id);
      setCompanies((prev) => prev.filter((c) => c.id !== id));
      if (selectedCompany?.id === id) {
        setSelectedCompany(companies.find((c) => c.id !== id) || null);
      }
    } catch (err) {
      console.error('Error deleting company:', err);
      throw err;
    }
  };

  const addEmployee = async (employee: Omit<Employee, 'id'>) => {
    if (!selectedCompany) return;
    try {
      const result = await companyService.getEmployeesByCompanyId(selectedCompany._id);
      const updatedCompany = {
        ...selectedCompany,
        employees: [...result, employee]
      };
      await updateCompany(selectedCompany._id, updatedCompany);
    } catch (err) {
      console.error('Error adding employee:', err);
      throw err;
    }
  };

  const importEmployees = async (employees: Omit<Employee, 'id'>[]) => {
    if (!selectedCompany) return;
    try {
      const result = await companyService.getEmployeesByCompanyId(selectedCompany._id);
      const updatedCompany = {
        ...selectedCompany,
        employees: [...result, ...employees]
      };
      await updateCompany(selectedCompany._id, updatedCompany);
    } catch (err) {
      console.error('Error importing employees:', err);
      throw err;
    }
  };

  const value: CompanyContextType = {
    companies,
    selectedCompany,
    setSelectedCompany: handleSetSelectedCompany,
    addCompany,
    updateCompany,
    deleteCompany,
    addEmployee,
    importEmployees,
    loading,
    error
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};

export default CompanyContext;
