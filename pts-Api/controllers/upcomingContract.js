const { UpcomingContract } = require('../models');

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]);

const parseDataUrl = (input) => {
  if (typeof input !== 'string') return { error: 'Invalid document format' };
  const match = input.trim().match(/^data:([\w.+-]+\/[\w.+-]+);base64,([A-Za-z0-9+/=\r\n]+)$/);
  if (!match) return { error: 'Invalid document payload' };

  const mimeType = match[1];
  const payload = match[2].replace(/\s+/g, '');
  const decoded = Buffer.from(payload, 'base64');
  const reEncoded = decoded.toString('base64').replace(/=+$/g, '');
  const normalized = payload.replace(/=+$/g, '');

  if (!decoded.length || reEncoded !== normalized) {
    return { error: 'Corrupted document payload' };
  }
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return { error: 'Only PDF or Word documents are allowed' };
  }

  return { mimeType, dataUrl: `data:${mimeType};base64,${payload}` };
};

const getUpcomingContracts = async (req, res) => {
  try {
    const data = await UpcomingContract.findAll({ order: [['createdAt', 'DESC']] });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch upcoming contracts', error: error.message });
  }
};

const uploadUpcomingContracts = async (req, res) => {
  try {
    const docs = Array.isArray(req.body.documents) ? req.body.documents : [];
    if (!docs.length) return res.status(400).json({ message: 'At least one document is required' });

    const records = [];
    for (const doc of docs) {
      const parsed = parseDataUrl(doc.fileData);
      if (parsed.error) return res.status(400).json({ message: parsed.error });

      const fileName = (doc.customFileName || doc.fileName || '').toString().trim();
      if (!fileName) return res.status(400).json({ message: 'File name is required' });

      records.push({
        fileName,
        mimeType: parsed.mimeType,
        documentData: parsed.dataUrl,
        uploadedBy: req.user?.id || null
      });
    }

    const created = await UpcomingContract.bulkCreate(records);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    res.status(500).json({ message: 'Failed to upload upcoming contracts', error: error.message });
  }
};

const deleteUpcomingContract = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const record = await UpcomingContract.findByPk(id);
    if (!record) return res.status(404).json({ message: 'Upcoming contract not found' });

    await record.destroy();
    res.json({ success: true, message: 'Upcoming contract deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete upcoming contract', error: error.message });
  }
};

module.exports = {
  getUpcomingContracts,
  uploadUpcomingContracts,
  deleteUpcomingContract
};
