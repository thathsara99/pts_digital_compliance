const { CompanyProfile, RegistrationDetail } = require('../models');
const { Op } = require('sequelize');

const getCompanyProfile = async (req, res) => {
    try {
      const profile = await CompanyProfile.findOne({
        include: [{ model: RegistrationDetail, as: 'registrationDetails' }]
      });
      res.json(profile);
    } catch (err) {
      res.status(500).json({ error: 'Failed to load profile', details: err });
    }
  };

  const createCompanyProfile = async (req, res) => {
    const data = req.body;
  
    try {
        console.log(data);
      let profile = await CompanyProfile.findOne();
  
      if (!profile) {
        // Create new
        profile = await CompanyProfile.create(data, {
          include: [{ model: RegistrationDetail, as: 'registrationDetails' }]
        });
      } else {
        // Update existing
        await profile.update(data);
  
        // Delete old registration details and add new ones
        await RegistrationDetail.destroy({ where: { companyProfileId: profile.id } });
  
        const details = data.registrationDetails || [];
        for (const detail of details) {
          await RegistrationDetail.create({
            ...detail,
            companyProfileId: profile.id
          });
        }
      }
  
      const updatedProfile = await CompanyProfile.findOne({
        include: [{ model: RegistrationDetail, as: 'registrationDetails' }]
      });
  
      res.json(updatedProfile);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to save profile', details: err });
    }
  };

  module.exports = {
    getCompanyProfile,
    createCompanyProfile
  };