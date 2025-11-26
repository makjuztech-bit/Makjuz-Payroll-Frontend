import React, { useRef } from 'react';
import { Modal, Button, Row, Col, Typography, Divider, message } from 'antd';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Employee } from '../../context/CompanyContext';

const { Text, Title } = Typography;

interface Props {
  visible: boolean;
  onClose: () => void;
  employee: Employee | null;
}

const EmployeeDetailModal: React.FC<Props> = ({ visible, onClose, employee }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!printRef.current) return;
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2, // sharper
        useCORS: true,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'pt', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${employee?.name || 'employee'}-details.pdf`);
    } catch (error) {
      console.error('PDF download failed:', error);
      message.error('Download failed');
    }
  };

  if (!employee) return null;

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="download" type="primary" onClick={handleDownload}>
          Download PDF
        </Button>,
        <Button key="close" onClick={onClose}>
          Close
        </Button>
      ]}
      width={750}
      title={`Employee Details - ${employee.name}`}
    >
      <div ref={printRef} style={{ background: '#fff', padding: 16 }}>
        <Title level={4} style={{ textAlign: 'center' }}>{employee.name}</Title>
        <Divider />
        <Row gutter={[16, 12]}>
          <Col span={12}><Text strong>Emp ID:</Text> {employee.empIdNo}</Col>
          <Col span={12}><Text strong>Department:</Text> {employee.department}</Col>
          <Col span={12}><Text strong>Designation:</Text> {employee.designation}</Col>
          <Col span={12}><Text strong>Gender:</Text> {employee.gender}</Col>
          <Col span={12}><Text strong>Date of Joining:</Text> {employee.dateOfJoining}</Col>
          <Col span={12}><Text strong>Fixed Stipend:</Text> ₹{employee.fixedStipend}</Col>
          <Col span={12}><Text strong>Father's Name:</Text> {employee.fatherName}</Col>
          <Col span={12}><Text strong>Location:</Text> {employee.location || 'N/A'}</Col>
          <Col span={12}><Text strong>Contact No:</Text> {employee.contactNumber}</Col>
          <Col span={12}><Text strong>Emergency Contact:</Text> {employee.emergencyContactNumber}</Col>
          <Col span={12}><Text strong>Qualification:</Text> {employee.qualification}</Col>
          <Col span={12}><Text strong>Blood Group:</Text> {employee.bloodGroup}</Col>
          <Col span={12}><Text strong>Aadhar No:</Text> {employee.adharNumber}</Col>
          <Col span={12}><Text strong>PAN No:</Text> {employee.panNumber}</Col>
          <Col span={12}><Text strong>UAN:</Text> {employee.uan}</Col>
          <Col span={12}><Text strong>ESI No:</Text> {employee.esiNumber}</Col>
          <Col span={12}><Text strong>Insurance No:</Text> {employee.insuranceNumber}</Col>
        </Row>
      </div>
    </Modal>
  );
};

export default EmployeeDetailModal;
