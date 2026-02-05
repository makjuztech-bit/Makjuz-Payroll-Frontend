import React, { useRef, useState, useEffect } from 'react';
import { Modal, Button, Typography, Divider, Row, Col, message } from 'antd';
import { FileWordOutlined } from '@ant-design/icons';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import logo from '../../assets/image.png';
import benefitService, { Benefit } from '../../services/benefitService';
import payrunService from '../../services/payrunService';

const { Title, Text } = Typography;

interface PayslipModalProps {
  visible: boolean;
  onClose: () => void;
  employee: any; // Change to any to accept both Employee and PayrunEmployee
  companyName: string;
  companyId: string;
  month: string;
  year: string;
}


const PayslipModal: React.FC<PayslipModalProps> = ({
  visible,
  onClose,
  employee,
  companyName,
  companyId,
  month,
  year
}) => {
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [downloading, setDownloading] = useState(false);

  console.log('PayslipModal received employee data:', employee);

  const ref = useRef<HTMLDivElement>(null);
  const payPeriod = `${month} ${year}`;

  // Fetch benefits when modal opens
  useEffect(() => {
    if (visible && companyId) {
      fetchBenefits();
    }
  }, [visible, companyId]);

  const fetchBenefits = async () => {
    try {
      const companyBenefits = await benefitService.getBenefits(companyId);
      // Only include active benefits
      setBenefits(companyBenefits.filter((benefit: Benefit) => benefit.active));
    } catch (error) {
      console.error('Error fetching benefits:', error);
      setBenefits([]);
    }
  };

  // Calculate total benefits amount
  const totalBenefitsAmount = benefits.reduce((sum, benefit) => sum + benefit.amount, 0);

  // Helper function to safely format numbers
  const formatCurrency = (value: number | undefined) => {
    return (value || 0).toFixed(2);
  };

  // Calculate adjusted values
  const adjustedTotalDeductions = (employee.totalDeductions || 0) + totalBenefitsAmount;
  const adjustedFinalNetPay = (employee.finalNetpay || employee.netEarning || 0) - totalBenefitsAmount;

  const handleDownload = async () => {
    if (!ref.current) return;
    try {
      const canvas = await html2canvas(ref.current);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'pt', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${employee.name}-payslip-${payPeriod}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const handleDownloadWord = async () => {
    try {
      setDownloading(true);
      message.loading({ content: 'Generating Word Payslip...', key: 'word_download' });

      const blob = await payrunService.downloadWordPayslip(companyId, employee._id || employee.id, month, year);

      const url = window.URL.createObjectURL(
        new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
      );

      const a = document.createElement('a');
      a.href = url;
      a.download = `${employee.name}-payslip-${month}-${year}.docx`;
      document.body.appendChild(a);
      a.click();

      setTimeout(() => window.URL.revokeObjectURL(url), 100);
      message.success({ content: 'Word Payslip downloaded!', key: 'word_download' });
    } catch (error) {
      console.error('Word download error:', error);
      message.error({ content: 'Failed to download Word Payslip. Ensure template is uploaded.', key: 'word_download' });
    } finally {
      setDownloading(false);
    }
  };

  // Handle employee ID display properly - could be emp_id_no from API or empIdNo from frontend
  const displayEmployeeId = () => {
    if (employee.emp_id_no) {
      return employee.emp_id_no;
    } else if (employee.empIdNo) {
      return employee.empIdNo;
    } else {
      return `EMP${employee._id?.toString().substring(0, 8) || ''}`;
    }
  };

  const numberToWords = (num: number) => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteenth ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const inWords = (n: number): string => {
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + ' ' + a[n % 10];
      if (n < 1000) return inWords(Math.floor(n / 100)) + 'Hundred ' + inWords(n % 100);
      if (n < 100000) return inWords(Math.floor(n / 1000)) + 'Thousand ' + inWords(n % 1000);
      if (n < 10000000) return inWords(Math.floor(n / 100000)) + 'Lakh ' + inWords(n % 100000);
      return inWords(Math.floor(n / 10000000)) + 'Crore ' + inWords(n % 10000000);
    };

    const str = inWords(Math.floor(num));
    return str ? str + 'Only' : 'Zero Only';
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Text style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: '#1890ff',
              fontFamily: 'Arial, sans-serif',
              letterSpacing: '1px',
              marginRight: 12
            }}>
              LEVIVAAN
            </Text>
          </div>
          <Divider type="vertical" style={{ margin: 0 }} />
          <span>Payslip — {companyName}</span>
        </div>
      }
      width={800}
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="download-pdf" onClick={handleDownload}>
          Download PDF
        </Button>,
        <Button
          key="download-word"
          type="primary"
          onClick={handleDownloadWord}
          loading={downloading}
          icon={<FileWordOutlined />}
        >
          Download Word
        </Button>,
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
      ]}
    >
      <div ref={ref} style={{ padding: '40px', background: '#fff', color: '#000', fontFamily: 'Arial, sans-serif' }}>
        {/* Header Section */}
        <Row align="middle" justify="space-between" style={{ marginBottom: '20px' }}>
          <Col span={8}>
            <img src={logo} alt="Logo" style={{ maxWidth: '180px' }} />
          </Col>
          <Col span={8} style={{ textAlign: 'center' }}>
            <Title level={2} style={{ margin: 0, textDecoration: 'underline', color: '#000' }}>TAX INVOICE</Title>
            <Text>Payslip for {payPeriod}</Text>
          </Col>
          <Col span={8} style={{ textAlign: 'right' }}>
            {/* Empty for balance or could put QR placeholder */}
          </Col>
        </Row>

        {/* Invoice Info Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '12px' }}>
          <tbody>
            <tr>
              <td style={{ width: '50%', border: '1px solid #000', padding: '8px' }}>
                <Text strong>Invoice No:</Text> LEV/{displayEmployeeId()}/{year.slice(-2)}-{parseInt(year.slice(-2)) + 1}<br />
                <Text strong>Invoice Date:</Text> {new Date().toLocaleDateString('en-GB')}<br />
                <Text strong>Tax Reverse Charge (Y/N):</Text> No<br />
                <Text strong>State:</Text> Tamil Nadu <Text strong>Code:</Text> 33
              </td>
              <td style={{ width: '50%', border: '1px solid #000', padding: '8px' }}>
                <Text strong>PO Number:</Text> - <Text strong>PO Date:</Text> -<br />
                <Text strong>IRN No:</Text> -<br />
                <Text strong>GSTIN:</Text> 33AAECL8763A1ZO<br />
                <Text strong>SAC Code Pin Code:</Text> 998519 / 600099
              </td>
            </tr>
          </tbody>
        </table>

        {/* Parties Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', marginTop: '10px', fontSize: '12px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', width: '50%' }}>Bill To Party (Employee Information)</th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', width: '50%' }}>Seller / Organization</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #000', padding: '8px', verticalAlign: 'top' }}>
                <Text strong>Name:</Text> {employee.name}<br />
                <Text strong>Division:</Text> {employee.department || '-'}<br />
                <Text strong>Address:</Text> {employee.location || employee.permanent_address || '-'}<br />
                <Text strong>State:</Text> {employee.state || 'Tamil Nadu'}<br />
                <Text strong>Pin Code:</Text> {employee.pincode || '-'}<br />
                <Text strong>Employee ID:</Text> {displayEmployeeId()}<br />
                <Text strong>Bank Type:</Text> {(employee.ifscCode || employee.ifsc_code || employee.ifsc)?.toUpperCase().startsWith('IOBA') ? 'IOB' : 'NON IOB'}
              </td>
              <td style={{ border: '1px solid #000', padding: '8px', verticalAlign: 'top' }}>
                <Text strong>LEVIVAAN SOLUTIONS PVT LTD</Text><br />
                17/2, Thirupathinagar, 1st main road,<br />
                Kolathur, Chennai - 600099<br />
                <Text strong>GSTIN:</Text> 33AAECL8763A1ZO<br />
                <Text strong>PH NO:</Text> 8608020025, 8939064040<br />
                <Text strong>Email:</Text> admin@levivaan.com
              </td>
            </tr>
          </tbody>
        </table>

        {/* Product Description / Earnings Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', marginTop: '10px', fontSize: '12px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>Product Description (Earnings & Deductions)</th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '100px' }}>Rate</th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '100px' }}>Qty / Days</th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', width: '120px' }}>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #000', padding: '8px' }}>CTC Salary for {payPeriod}</td>
              <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>-</td>
              <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{employee.presentDays || 0}</td>
              <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>{formatCurrency(employee.totalEarning)}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '8px' }}>Less: Total Deductions (Incl. Management Fee, Insurance)</td>
              <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>-</td>
              <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>-</td>
              <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>-{formatCurrency(adjustedTotalDeductions)}</td>
            </tr>
            {benefits.length > 0 && benefits.map(b => (
              <tr key={b._id}>
                <td style={{ border: '1px solid #000', padding: '8px' }}>Less: {b.title}</td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>-</td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>-</td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>-{formatCurrency(b.amount)}</td>
              </tr>
            ))}
            <tr style={{ fontWeight: 'bold' }}>
              <td colSpan={3} style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>Total Net Payable</td>
              <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>₹{formatCurrency(adjustedFinalNetPay)}</td>
            </tr>
          </tbody>
        </table>

        <div style={{ marginTop: '10px', fontSize: '12px', fontStyle: 'italic' }}>
          <Text strong>RUPEES:</Text> {numberToWords(adjustedFinalNetPay)}
        </div>

        {/* Footer Details */}
        <Row style={{ marginTop: '20px', fontSize: '11px', border: '1px solid #000', padding: '10px' }}>
          <Col span={24}>
            <Text strong>PAN NO:</Text> AAECL8763A | <Text strong>CIN:</Text> U74140TN2022PTC148967<br />
            <Text strong>Details Of The Payment To Be Made To:</Text> "Levivaan Solutions Private Limited"<br />
            <Text strong>Account No:</Text> 332802000000181 | <Text strong>IFSC:</Text> IOBA0003328 | <Text strong>Bank:</Text> IOB Kolathur
          </Col>
        </Row>

        {/* Terms and Signature */}
        <Row style={{ marginTop: '10px', fontSize: '11px' }}>
          <Col span={14} style={{ border: '1px solid #000', padding: '10px' }}>
            <Text strong>Terms & Conditions:</Text><br />
            We declare that this invoice shows that actual price of the service provided and that all particulars are true and correct. All disputes are subject to Chennai Jurisdiction.
          </Col>
          <Col span={10} style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Text>Certified that the particular given above are true and correct</Text>
            <div style={{ marginTop: '40px' }}>
              <Text strong>A. Silambarasan</Text><br />
              <Text>Director</Text>
            </div>
          </Col>
        </Row>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '10px', color: '#666' }}>
          Regoff: 17/2, Thirupathinagar, 1st main road, Kolathur, ch-99 PHNO: 8608020025, 8939064040<br />
          Email: admin@levivaan.com | Web: www.levivaansolutions.com
        </div>
      </div>
    </Modal>
  );
};

export default PayslipModal;