#!/usr/bin/env node

/**
 * Script de test pour vérifier la configuration des emails
 * Usage: node test-email-config.js
 */

const { PrismaClient } = require('@prisma/client');

async function testEmailConfiguration() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Vérification de la configuration email...\n');
    
    // Récupérer les paramètres
    const settings = await prisma.settings.findUnique({
      where: { id: 'singleton' }
    });
    
    if (!settings) {
      console.error('❌ Aucune configuration trouvée !');
      return;
    }
    
    console.log('📧 Configuration actuelle :');
    console.log(`   Nom du studio : ${settings.studioName}`);
    console.log(`   Email expéditeur : ${settings.senderEmail}`);
    console.log(`   Email studio : ${settings.studioEmail}`);
    console.log(`   Téléphone : ${settings.studioPhone}`);
    console.log(`   Adresse : ${settings.studioAddress}`);
    
    console.log('\n📩 Configuration des emails :');
    console.log(`   FROM: ${settings.studioName} <${settings.senderEmail}>`);
    console.log(`   REPLY-TO: ${settings.studioEmail}`);
    
    // Vérifications
    const issues = [];
    
    if (!settings.senderEmail) {
      issues.push('❌ Email expéditeur manquant');
    }
    
    if (!settings.studioEmail) {
      issues.push('❌ Email studio manquant');
    }
    
    if (settings.senderEmail === settings.studioEmail) {
      issues.push('⚠️  Email expéditeur et studio sont identiques');
    }
    
    if (!settings.studioName) {
      issues.push('❌ Nom du studio manquant');
    }
    
    if (issues.length === 0) {
      console.log('\n✅ Configuration email correcte !');
      console.log('\n📋 Comportement attendu :');
      console.log('   • Les emails sont envoyés depuis devis@mail.studiomae.fr');
      console.log('   • Les réponses sont redirigées vers contact@studiomae.fr');
      console.log('   • Les clients voient une note les invitant à répondre directement');
    } else {
      console.log('\n⚠️  Problèmes détectés :');
      issues.forEach(issue => console.log(`   ${issue}`));
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test :', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le test
testEmailConfiguration().catch(console.error);
