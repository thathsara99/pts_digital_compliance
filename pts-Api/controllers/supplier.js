const { Supplier } = require('../models');

const SUPPLIER_ALLOWED_ROLES = new Set(['Super Admin', 'HR Admin', 'HR Manager', 'HR', 'System Admin', 'Company Admin']);

const canManageSuppliers = (role) => SUPPLIER_ALLOWED_ROLES.has(role);

const normalizeDataUrlString = (val) => {
  if (val == null || val === '') return { value: null };
  if (typeof val !== 'string') return { error: 'Invalid file format' };

  const trimmed = val.trim();
  const match = trimmed.match(/^data:([\w.+-]+\/[\w.+-]+);base64,([A-Za-z0-9+/=\r\n]+)$/);
  if (!match) {
    return { error: 'Invalid file format. Expected a base64 data URL.' };
  }

  const mimeType = match[1];
  const base64Payload = match[2].replace(/\s+/g, '');
  const decoded = Buffer.from(base64Payload, 'base64');
  const reEncoded = decoded.toString('base64').replace(/=+$/g, '');
  const inputNormalized = base64Payload.replace(/=+$/g, '');

  if (!decoded.length || reEncoded !== inputNormalized) {
    return { error: 'Invalid file payload. Please upload the file again.' };
  }

  return { value: `data:${mimeType};base64,${base64Payload}` };
};

const normalizeSupportingDocuments = (input) => {
  if (input == null || input === '') return { value: [] };

  let docs = input;
  if (typeof docs === 'string' && docs.trim().startsWith('[')) {
    try {
      docs = JSON.parse(docs);
    } catch (error) {
      return { error: 'Invalid supporting documents payload' };
    }
  }

  if (!Array.isArray(docs)) {
    docs = [docs];
  }

  const normalized = [];
  for (const doc of docs) {
    const { value, error } = normalizeDataUrlString(doc);
    if (error) return { error };
    if (value) normalized.push(value);
  }

  return { value: normalized };
};

const parseSupportingDocuments = (supplier) => {
  const raw = supplier.supportingDocument;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch (error) {
    // Backward compatibility for old single-document records
  }
  return [raw];
};

const denyIfNotAllowed = (req, res) => {
  if (!canManageSuppliers(req.user?.role)) {
    res.status(403).json({ message: 'You do not have permission to access suppliers' });
    return true;
  }
  return false;
};

const getSuppliers = async (req, res) => {
  try {
    if (denyIfNotAllowed(req, res)) return;

    const suppliers = await Supplier.findAll({
      order: [['createdAt', 'DESC']]
    });

    const transformed = suppliers.map((supplier) => {
      const json = supplier.toJSON();
      json.supportingDocuments = parseSupportingDocuments(supplier);
      return json;
    });

    res.json({ success: true, data: transformed });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch suppliers', error: error.message });
  }
};

const createSupplier = async (req, res) => {
  try {
    if (denyIfNotAllowed(req, res)) return;

    const { value, error } = normalizeSupportingDocuments(
      req.body.supportingDocuments ?? req.body.supportingDocument
    );
    if (error) return res.status(400).json({ message: error });

    const supplier = await Supplier.create({
      supplierName: req.body.supplierName,
      contactPerson: req.body.contactPerson,
      email: req.body.email,
      contactNumber: req.body.contactNumber,
      departmentName: req.body.departmentName,
      address: req.body.address,
      notes: req.body.notes,
      status: req.body.status || 'Active',
      supportingDocument: JSON.stringify(value)
    });

    const json = supplier.toJSON();
    json.supportingDocuments = value;
    res.status(201).json({ success: true, data: json });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create supplier', error: error.message });
  }
};

const updateSupplier = async (req, res) => {
  try {
    if (denyIfNotAllowed(req, res)) return;

    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) return res.status(404).json({ message: 'Supplier not found' });

    const updates = { ...req.body };
    if ('supportingDocuments' in updates || 'supportingDocument' in updates) {
      const { value, error } = normalizeSupportingDocuments(
        updates.supportingDocuments ?? updates.supportingDocument
      );
      if (error) return res.status(400).json({ message: error });
      updates.supportingDocument = JSON.stringify(value);
      delete updates.supportingDocuments;
    }

    await supplier.update(updates);
    const json = supplier.toJSON();
    json.supportingDocuments = parseSupportingDocuments(supplier);
    res.json({ success: true, data: json });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update supplier', error: error.message });
  }
};

const deleteSupplier = async (req, res) => {
  try {
    if (denyIfNotAllowed(req, res)) return;

    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) return res.status(404).json({ message: 'Supplier not found' });

    await supplier.destroy();
    res.json({ success: true, message: 'Supplier deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete supplier', error: error.message });
  }
};

module.exports = {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier
};
