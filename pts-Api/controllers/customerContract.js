const { Customer, CustomerContract } = require('../models');

const ALLOWED_CONTRACT_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]);

const parseDataUrl = (input) => {
  if (typeof input !== 'string') {
    return { error: 'Invalid document format' };
  }

  const match = input.trim().match(/^data:([\w.+-]+\/[\w.+-]+);base64,([A-Za-z0-9+/=\r\n]+)$/);
  if (!match) {
    return { error: 'Invalid document payload' };
  }

  const mimeType = match[1];
  const payload = match[2].replace(/\s+/g, '');
  const decoded = Buffer.from(payload, 'base64');
  const reEncoded = decoded.toString('base64').replace(/=+$/g, '');
  const normalized = payload.replace(/=+$/g, '');

  if (!decoded.length || reEncoded !== normalized) {
    return { error: 'Corrupted document payload' };
  }

  if (!ALLOWED_CONTRACT_MIME_TYPES.has(mimeType)) {
    return { error: 'Only PDF or Word documents are allowed' };
  }

  return { mimeType, dataUrl: `data:${mimeType};base64,${payload}` };
};

const getCustomerContracts = async (req, res) => {
  try {
    const customerId = Number(req.params.customerId);
    const customer = await Customer.findByPk(customerId);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const contracts = await CustomerContract.findAll({
      where: { customerId },
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'customerName']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, data: contracts });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch customer contracts', error: error.message });
  }
};

const uploadCustomerContracts = async (req, res) => {
  try {
    const customerId = Number(req.params.customerId);
    const customer = await Customer.findByPk(customerId);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const docs = Array.isArray(req.body.documents) ? req.body.documents : [];
    if (!docs.length) {
      return res.status(400).json({ message: 'At least one document is required' });
    }

    const records = [];
    for (const doc of docs) {
      const fileName = (doc.fileName || '').toString().trim();
      const payload = doc.fileData;
      if (!fileName) return res.status(400).json({ message: 'Document fileName is required' });

      const parsed = parseDataUrl(payload);
      if (parsed.error) return res.status(400).json({ message: `${fileName}: ${parsed.error}` });

      records.push({
        customerId,
        fileName,
        mimeType: parsed.mimeType,
        documentData: parsed.dataUrl,
        uploadedBy: req.user?.id || null
      });
    }

    const created = await CustomerContract.bulkCreate(records);
    const fullRecords = await CustomerContract.findAll({
      where: { id: created.map((item) => item.id) },
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'customerName']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.status(201).json({ success: true, data: fullRecords });
  } catch (error) {
    res.status(500).json({ message: 'Failed to upload customer contracts', error: error.message });
  }
};

const deleteCustomerContract = async (req, res) => {
  try {
    const customerId = Number(req.params.customerId);
    const id = Number(req.params.id);
    const contract = await CustomerContract.findOne({ where: { id, customerId } });
    if (!contract) return res.status(404).json({ message: 'Contract document not found' });

    await contract.destroy();
    res.json({ success: true, message: 'Contract document deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete contract document', error: error.message });
  }
};

module.exports = {
  getCustomerContracts,
  uploadCustomerContracts,
  deleteCustomerContract
};
