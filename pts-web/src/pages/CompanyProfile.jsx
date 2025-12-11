import React, { useState, useRef, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Collapse,
  Steps,
  message,
  Row,
  Col,
  Divider,
  Space,
  Spin,
} from 'antd';
import {
  PlusOutlined,
  MinusCircleOutlined,
  SaveOutlined,
  ClearOutlined,
  FilePdfOutlined,
} from '@ant-design/icons';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import axios from 'axios';

const { Panel } = Collapse;
const { Step } = Steps;

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE || 'http://localhost:5000/api',
});

const CompanyProfilePage = () => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const formRef = useRef(null);

  // Fetch existing profile on load
  useEffect(() => {
    fetchCompanyProfile();
  }, []);

  const fetchCompanyProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/company-profile');
      if (res.data) {
        form.setFieldsValue(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      message.error('Could not load company profile');
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    try {
      await api.post('/company-profile', values);
      message.success('Company profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      message.error('Failed to update company profile');
    }
  };

  const onReset = () => {
    form.resetFields();
  };

  const exportToPDF = () => {
    const input = formRef.current;
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('company_profile.pdf');
    });
  };

  const next = () => {
    form
      .validateFields()
      .then(() => setCurrentStep(currentStep + 1))
      .catch((errorInfo) => console.log('Validation Failed:', errorInfo));
  };

  const prev = () => setCurrentStep(currentStep - 1);

  const steps = [
    {
      title: 'Company Information',
      content: (
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="companyName"
              label="Company Name"
              rules={[{ required: true, message: 'Please enter the company name' }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="companyAddress"
              label="Company Address"
              rules={[{ required: true, message: 'Please enter the company address' }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="companyEmail"
              label="Company Email Address"
              rules={[
                { required: true, message: 'Please enter the company email address' },
                { type: 'email', message: 'Please enter a valid email address' },
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="companyContact"
              label="Company Contact Number"
              rules={[{ required: true, message: 'Please enter the contact number' }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="companyWebsite" label="Company Website">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="companyFaceBook" label="Company Facebook Profile">
              <Input />
            </Form.Item>
          </Col>
        </Row>
      ),
    },
    {
      title: 'General Information',
      content: (
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="hawickMarketPayeeCode" label="Hawick Market Payee Code">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="accountOfficeReferences" label="Account Office References">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="companyTaxCode" label="Company Tax Code">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="localAuthorityName" label="Local Authority Name">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="localPoliceContact" label="Local Police Station Contact Number">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="maintainEmergency" label="Emergency Maintenance Contact Info">
              <Input.TextArea rows={2} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="regsiteredManagerContactNumber" label="Registered Manager Contact Number">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="nameOfRegisteredManager" label="Name of Registered Manager">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="companyOfficeHours" label="Company Office Hours">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="registeredProviderName" label="Registered Provider Name">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="mediaEnquiryHandlingPerson" label="Media Enquiry Handling Person">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="responsibleForComplaints" label="Responsible for Complaints">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="securitySystemProvider" label="Security System Provider">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="securityAlarmContactNumber" label="Security Alarm Contact Number">
              <Input />
            </Form.Item>
          </Col>
        </Row>
      ),
    },
    {
      title: 'Additional Information',
      content: (
        <Collapse defaultActiveKey={['1']}>
          <Panel header="Registration Details" key="1">
            <Form.List name="registrationDetails">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Row gutter={16} key={key} align="middle">
                      <Col span={10}>
                        <Form.Item
                          {...restField}
                          name={[name, 'label']}
                          rules={[{ required: true, message: 'Label is required' }]}
                        >
                          <Input placeholder="Label (e.g., Tax ID)" />
                        </Form.Item>
                      </Col>
                      <Col span={10}>
                        <Form.Item
                          {...restField}
                          name={[name, 'value']}
                          rules={[{ required: true, message: 'Value is required' }]}
                        >
                          <Input placeholder="Value" />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Button danger onClick={() => remove(name)} icon={<MinusCircleOutlined />} />
                      </Col>
                    </Row>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      Add Custom Field
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Panel>
        </Collapse>
      ),
    },
  ];

  return (
    <div style={{ padding: '50px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Card
        title="Company Profile"
        style={{
          maxWidth: 1000,
          height: '90vh',
          margin: 'auto',
          backgroundColor: 'white',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {loading ? (
          <Spin tip="Loading..." size="large" style={{ marginTop: 100, textAlign: 'center' }} />
        ) : (
          <>
            <div
              ref={formRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                paddingRight: 10,
                maxHeight: '60vh',
              }}
            >
              <Form form={form} layout="vertical" onFinish={onFinish}>
                <Steps current={currentStep} style={{ marginBottom: 24 }}>
                  {steps.map((item) => (
                    <Step key={item.title} title={item.title} />
                  ))}
                </Steps>
                <div>{steps[currentStep].content}</div>
                <Divider />
              </Form>
            </div>

            <div style={{ marginTop: 16 }}>
              <Form.Item>
                <Space>
                  {currentStep > 0 && <Button onClick={prev}>Previous</Button>}
                  {currentStep < steps.length - 1 && (
                    <Button type="primary" onClick={next}>
                      Next
                    </Button>
                  )}
                  {currentStep === steps.length - 1 && (
                    <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={async () => {
                      try {
                        const allValues = form.getFieldsValue(true); // Get all form values, even from unmounted fields
                        await onFinish(allValues); // Call your onFinish handler manually
                      } catch (err) {
                        console.error('Submission error:', err);
                      }
                    }}
                  >
                    Update
                  </Button>
                  )}
                  <Button onClick={onReset} icon={<ClearOutlined />}>
                    Clear
                  </Button>
                  <Button onClick={exportToPDF} icon={<FilePdfOutlined />}>
                    Export to PDF
                  </Button>
                </Space>
              </Form.Item>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default CompanyProfilePage;
