import { PrismaClient, BillingCycle } from "../src/generated";

const prisma = new PrismaClient();

async function seedPlans() {
    console.log('Seeding plans...');

    // 1. FREE / DEMO PLAN
    const freePlan = await prisma.plan.upsert({
        where: { id: 'plan_free_demo' },
        create: {
            id: 'plan_free_demo',
            name: 'Free / Demo',
            description: 'Suitable for individuals to demo and explore cmlabs CMS',
            price: 0,
            billingCycle: 'MONTHLY',
            features: {
                users: 1,
                personalProjects: 5,
                apiCalls: '500K / month',
                mediaAssets: '100 file',
                seoIntegrated: true,
            },
            limits: {
                users: 1,
                projects: 5,
                apiCalls: 500000,
                mediaAssets: 100,
                bandwidth: 1,
                collaborators: 0,
                webhooks: 0,
                models: 3,
                locales: 1,
                records: 100,
            },
            isActive: true,
        },
        update: {
            description: 'Suitable for individuals to demo and explore cmlabs CMS',
            price: 0,
            billingCycle: 'MONTHLY',
            features: {
                users: 1,
                personalProjects: 5,
                apiCalls: '500K / month',
                mediaAssets: '100 file',
                seoIntegrated: true,
            },
            limits: {
                users: 1,
                projects: 5,
                apiCalls: 500000,
                mediaAssets: 100,
                bandwidth: 1,
                collaborators: 0,
                webhooks: 0,
                models: 3,
                locales: 1,
                records: 100,
            },
        },
    });

    console.log('Free plan created:', freePlan.name);

    // 2. PROFESSIONAL PLAN
    const proPlan = await prisma.plan.upsert({
        where: { id: 'plan_professional' },
        create: {
            id: 'plan_professional',
            name: 'Professional',
            description: 'Ideal for growing teams with full access only granted to pro users.',
            price: 100000, // IDR 100,000
            billingCycle: 'MONTHLY',
            features: {
                users: '10 User for organization (must Pro)',
                personalProjects: '50 Personal Projects',
                organizations: '10 Organization (20 Projects)',
                apiCalls: '5 Million / month',
                mediaAssets: '5000 file',
                seoIntegrated: true,
                aiAssistance: true,
                customDomain: true,
            },
            limits: {
                users: 10,
                projects: 50,
                organizations: 10,
                projectsPerOrganization: 20,
                apiCalls: 5000000,
                mediaAssets: 5000,
                bandwidth: 10,
                collaborators: 10,
                webhooks: 5,
                models: 20,
                locales: 5,
                records: 5000,
            },
            isActive: true,
        },
        update: {
            description: 'Ideal for growing teams with full access only granted to pro users.',
            price: 100000,
            billingCycle: 'MONTHLY',
            features: {
                users: '10 User for organization (must Pro)',
                personalProjects: '50 Personal Projects',
                organizations: '10 Organization (20 Projects)',
                apiCalls: '5 Million / month',
                mediaAssets: '5000 file',
                seoIntegrated: true,
                aiAssistance: true,
                customDomain: true,
            },
            limits: {
                users: 10,
                projects: 50,
                organizations: 10,
                projectsPerOrganization: 20,
                apiCalls: 5000000,
                mediaAssets: 5000,
                bandwidth: 10,
                collaborators: 10,
                webhooks: 5,
                models: 20,
                locales: 5,
                records: 5000,
            },
        },
    });

    console.log('Professional plan created:', proPlan.name);

    // 3. ENTERPRISE PLAN
    const enterprisePlan = await prisma.plan.upsert({
        where: { id: 'plan_enterprise' },
        create: {
            id: 'plan_enterprise',
            name: 'Enterprise',
            description: 'Suitable for companies needing scalability, advanced features, and smooth collaboration.',
            price: 500000, // IDR 500,000
            billingCycle: 'MONTHLY',
            features: {
                users: '50 User for organization (all users)',
                personalProjects: 'Unlimited Personal Projects',
                organizations: '50 Organization (100 Projects)',
                apiCalls: '10 Million / month',
                mediaAssets: 'unlimited file',
                seoIntegrated: true,
                aiAssistance: true,
                customDomain: true,
            },
            limits: {
                users: 50,
                projects: -1, // unlimited
                organizations: 50,
                projectsPerOrganization: 100,
                apiCalls: 10000000,
                mediaAssets: -1, // unlimited
                bandwidth: 100,
                collaborators: 50,
                webhooks: 20,
                models: -1,
                locales: -1,
                records: -1,
            },
            isActive: true,
        },
        update: {
            description: 'Suitable for companies needing scalability, advanced features, and smooth collaboration.',
            price: 500000,
            billingCycle: 'MONTHLY',
            features: {
                users: '50 User for organization (all users)',
                personalProjects: 'Unlimited Personal Projects',
                organizations: '50 Organization (100 Projects)',
                apiCalls: '10 Million / month',
                mediaAssets: 'unlimited file',
                seoIntegrated: true,
                aiAssistance: true,
                customDomain: true,
            },
            limits: {
                users: 50,
                projects: -1,
                organizations: 50,
                projectsPerOrganization: 100,
                apiCalls: 10000000,
                mediaAssets: -1,
                bandwidth: 100,
                collaborators: 50,
                webhooks: 20,
                models: -1,
                locales: -1,
                records: -1,
            },
        },
    });

    console.log('Enterprise plan created:', enterprisePlan.name);

    // 4. WHITE LABEL PLAN
    const whiteLabelPlan = await prisma.plan.upsert({
        where: { id: 'plan_white_label' },
        create: {
            id: 'plan_white_label',
            name: 'White Label',
            description: 'Take full ownership of the CMS platform, deploy it under your infrastructure, with your own branding and configurations.',
            price: 2000000, // IDR 2,000,000
            billingCycle: 'YEARLY',
            features: {
                fullSourceCodeAccess: true,
                fullyConfigurableModules: true,
                customBranding: true,
                cmsOwnership: true,
                lifetimeLicence: true,
            },
            limits: {
                users: -1,
                projects: -1,
                organizations: -1,
                projectsPerOrganization: -1,
                apiCalls: -1,
                mediaAssets: -1,
                bandwidth: -1,
                collaborators: -1,
                webhooks: -1,
                models: -1,
                locales: -1,
                records: -1,
            },
            isActive: true,
        },
        update: {
            description: 'Take full ownership of the CMS platform, deploy it under your infrastructure, with your own branding and configurations.',
            price: 2000000,
            billingCycle: 'YEARLY',
            features: {
                fullSourceCodeAccess: true,
                fullyConfigurableModules: true,
                customBranding: true,
                cmsOwnership: true,
                lifetimeLicence: true,
            },
            limits: {
                users: -1,
                projects: -1,
                organizations: -1,
                projectsPerOrganization: -1,
                apiCalls: -1,
                mediaAssets: -1,
                bandwidth: -1,
                collaborators: -1,
                webhooks: -1,
                models: -1,
                locales: -1,
                records: -1,
            },
        },
    });

    console.log('White Label plan created:', whiteLabelPlan.name);

    console.log('All plans seeded successfully!');
}

seedPlans()
    .catch((e) => {
        console.error('Error seeding plans:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });