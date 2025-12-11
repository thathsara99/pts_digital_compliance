const { Document, User } = require('../models');
const { Op } = require('sequelize');

// Upload document for existing employee
const uploadEmployeeDocument = async (req, res) => {
  try {
    const { fileName, documentType, fileData, fileType, fileSize, userId } = req.body;

    if (!fileName || !documentType || !fileData || !fileType || !fileSize || !userId) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Debug: Check incoming data
    console.log('Upload - File size:', fileSize);
    console.log('Upload - Base64 length:', fileData ? fileData.length : 0);
    console.log('Upload - Base64 preview:', fileData ? fileData.substring(0, 100) + '...' : 'null');

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const document = await Document.create({
      fileName,
      documentType,
      fileData,
      fileType,
      fileSize,
      userId,
      status: 'Active'
    });

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        id: document.id,
        fileName: document.fileName,
        documentType: document.documentType,
        userId: document.userId,
        createdAt: document.createdAt
      }
    });
  } catch (error) {
    console.error('Error uploading employee document:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Upload document for new applicant
const uploadApplicantDocument = async (req, res) => {
  try {
    const { fileName, documentType, fileData, fileType, fileSize, applicantName, applicantEmail } = req.body;

    if (!fileName || !documentType || !fileData || !fileType || !fileSize || !applicantName) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    const document = await Document.create({
      fileName,
      documentType,
      fileData,
      fileType,
      fileSize,
      applicantName,
      applicantEmail,
      status: 'Active'
    });

    res.status(201).json({
      success: true,
      message: 'Applicant document uploaded successfully',
      data: {
        id: document.id,
        fileName: document.fileName,
        documentType: document.documentType,
        applicantName: document.applicantName,
        createdAt: document.createdAt
      }
    });
  } catch (error) {
    console.error('Error uploading applicant document:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all employee documents
const getEmployeeDocuments = async (req, res) => {
  try {
    const { documentType, userId } = req.query;
    const whereClause = {
      status: 'Active',
      userId: { [Op.ne]: null }
    };

    if (documentType) {
      whereClause.documentType = documentType;
    }

    if (userId) {
      whereClause.userId = userId;
    }

    const documents = await Document.findAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });

    const formattedDocuments = documents.map(doc => ({
      id: doc.id,
      fileName: doc.fileName,
      documentType: doc.documentType,
      fileType: doc.fileType,
      fileSize: doc.fileSize,
      employeeEmail: doc.user?.email,
      employeeName: doc.user ? `${doc.user.firstName} ${doc.user.lastName}` : '',
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    }));

    res.json({
      success: true,
      data: formattedDocuments
    });
  } catch (error) {
    console.error('Error fetching employee documents:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all applicant documents
const getApplicantDocuments = async (req, res) => {
  try {
    const { documentType, applicantName } = req.query;
    const whereClause = {
      status: 'Active',
      applicantName: { [Op.ne]: null }
    };

    if (documentType) {
      whereClause.documentType = documentType;
    }

    if (applicantName) {
      whereClause.applicantName = {
        [Op.iLike]: `%${applicantName}%`
      };
    }

    const documents = await Document.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });

    const formattedDocuments = documents.map(doc => ({
      id: doc.id,
      fileName: doc.fileName,
      documentType: doc.documentType,
      fileType: doc.fileType,
      fileSize: doc.fileSize,
      applicantName: doc.applicantName,
      applicantEmail: doc.applicantEmail,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    }));

    res.json({
      success: true,
      data: formattedDocuments
    });
  } catch (error) {
    console.error('Error fetching applicant documents:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get document by ID (for viewing/downloading)
const getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await Document.findOne({
      where: {
        id,
        status: 'Active'
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }]
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Debug: Check if fileData is complete
    console.log('Document ID:', document.id);
    console.log('File size:', document.fileSize);
    console.log('Base64 length:', document.fileData ? document.fileData.length : 0);
    console.log('Base64 preview:', document.fileData ? document.fileData.substring(0, 100) + '...' : 'null');
    
    // Check if base64 data is complete (should be roughly 4/3 of file size)
    const expectedBase64Length = Math.ceil((document.fileSize * 4) / 3);
    console.log('Expected base64 length:', expectedBase64Length);
    console.log('Is base64 complete:', document.fileData && document.fileData.length >= expectedBase64Length * 0.9);

    // Check if base64 data is complete before creating data URL
    const isBase64Complete = document.fileData && document.fileData.length >= expectedBase64Length * 0.9;
    
    if (!isBase64Complete) {
      console.error('Base64 data is incomplete!');
      return res.status(500).json({
        success: false,
        message: 'Document data is corrupted or incomplete'
      });
    }

    // Create data URL for the file
    const dataUrl = `data:${document.fileType};base64,${document.fileData}`;

    res.json({
      success: true,
      data: {
        id: document.id,
        fileName: document.fileName,
        documentType: document.documentType,
        fileType: document.fileType,
        fileSize: document.fileSize,
        fileData: dataUrl,
        employeeEmail: document.user?.email,
        employeeName: document.user ? `${document.user.firstName} ${document.user.lastName}` : '',
        applicantName: document.applicantName,
        applicantEmail: document.applicantEmail,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete document
const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await Document.findByPk(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Soft delete by updating status
    await document.update({ status: 'Deleted' });

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get available users for dropdown
const getAvailableUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: {
        status: true
      },
      attributes: ['id', 'firstName', 'lastName', 'email'],
      order: [['firstName', 'ASC']]
    });

    const userOptions = users.map(user => ({
      label: user.email,
      value: user.id,
      name: `${user.firstName} ${user.lastName}`
    }));

    res.json({
      success: true,
      data: userOptions
    });
  } catch (error) {
    console.error('Error fetching available users:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Test endpoint to verify database can handle large data
const testLargeData = async (req, res) => {
  try {
    // Create a test base64 string of 1MB
    const testData = 'A'.repeat(1000000); // 1MB of data
    
    const document = await Document.create({
      fileName: 'test-large-file',
      documentType: 'Other',
      fileData: testData,
      fileType: 'text/plain',
      fileSize: 1000000,
      status: 'Active'
    });

    // Try to retrieve it
    const retrieved = await Document.findByPk(document.id);
    
    res.json({
      success: true,
      message: 'Large data test completed',
      data: {
        originalLength: testData.length,
        retrievedLength: retrieved.fileData.length,
        isComplete: testData.length === retrieved.fileData.length
      }
    });
  } catch (error) {
    console.error('Error testing large data:', error);
    res.status(500).json({
      success: false,
      message: 'Large data test failed',
      error: error.message
    });
  }
};

// Debug endpoint to check existing document data
const debugDocument = async (req, res) => {
  try {
    const { id } = req.params;
    
    const document = await Document.findByPk(id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const expectedBase64Length = Math.ceil((document.fileSize * 4) / 3);
    
    res.json({
      success: true,
      data: {
        id: document.id,
        fileName: document.fileName,
        fileSize: document.fileSize,
        base64Length: document.fileData ? document.fileData.length : 0,
        expectedBase64Length,
        isComplete: document.fileData && document.fileData.length >= expectedBase64Length * 0.9,
        base64Preview: document.fileData ? document.fileData.substring(0, 200) + '...' : 'null',
        base64End: document.fileData ? '...' + document.fileData.substring(document.fileData.length - 50) : 'null'
      }
    });
  } catch (error) {
    console.error('Error debugging document:', error);
    res.status(500).json({
      success: false,
      message: 'Debug failed',
      error: error.message
    });
  }
};

module.exports = {
  uploadEmployeeDocument,
  uploadApplicantDocument,
  getEmployeeDocuments,
  getApplicantDocuments,
  getDocumentById,
  deleteDocument,
  getAvailableUsers,
  testLargeData,
  debugDocument
}; 